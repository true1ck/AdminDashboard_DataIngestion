import os
import base64
import io
import traceback
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from PIL import Image
import fitz  # PyMuPDF

load_dotenv()

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Configuration
HF_API_TOKEN = os.getenv('HF_API_TOKEN', '')
MODEL_ID = "Qwen/Qwen2.5-VL-7B-Instruct"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def image_to_base64(image_file):
    """Convert uploaded image to base64 data URI."""
    img = Image.open(image_file)
    # Convert to RGB if necessary (handles RGBA, palette, etc.)
    if img.mode not in ('RGB', 'L'):
        img = img.convert('RGB')
    # Resize if too large (max 1024px on longest side) to reduce API payload
    max_dim = 1024
    if max(img.size) > max_dim:
        ratio = max_dim / max(img.size)
        new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
        img = img.resize(new_size, Image.LANCZOS)
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=85)
    buffer.seek(0)
    b64 = base64.b64encode(buffer.read()).decode('utf-8')
    return f"data:image/jpeg;base64,{b64}"


@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'model': MODEL_ID,
        'api_configured': bool(HF_API_TOKEN and HF_API_TOKEN != 'your_huggingface_token_here')
    })


@app.route('/api/analyze', methods=['POST'])
def analyze_image():
    """Analyze an uploaded image using Qwen2.5-VL."""

    # Validate API token
    if not HF_API_TOKEN or HF_API_TOKEN == 'your_huggingface_token_here':
        return jsonify({
            'error': 'HuggingFace API token not configured. Please add your token to the .env file.',
            'help': 'Get a free token at https://huggingface.co/settings/tokens'
        }), 401

    # Validate image file
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided. Please upload an image.'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No file selected.'}), 400

    if not allowed_file(file.filename):
        return jsonify({
            'error': f'Invalid file type. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
        }), 400

    # Check file size
    file.seek(0, 2)
    file_size = file.tell()
    file.seek(0)
    if file_size > MAX_FILE_SIZE:
        return jsonify({'error': 'File too large. Maximum size is 10MB.'}), 400

    # Get optional prompt
    prompt = request.form.get('prompt', 'Describe this image in detail. If there are any people or entities in the picture, please attempt to identify who they are. If there is any text in the image, extract and include it.')

    try:
        # Convert image to base64
        image_data_uri = image_to_base64(file)

        # Create HuggingFace Inference Client (auto-routes to available provider)
        client = InferenceClient(
            api_key=HF_API_TOKEN
        )

        # Build the message with image
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_data_uri
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]

        # Call the model
        completion = client.chat.completions.create(
            model=MODEL_ID,
            messages=messages,
            max_tokens=2048
        )

        result_text = completion.choices[0].message.content

        return jsonify({
            'success': True,
            'result': result_text,
            'model': MODEL_ID,
            'prompt': prompt
        })

    except Exception as e:
        error_msg = str(e)
        print(f"Error analyzing image: {error_msg}")
        traceback.print_exc()

        # Provide helpful error messages
        if '401' in error_msg or 'unauthorized' in error_msg.lower():
            return jsonify({
                'error': 'Invalid HuggingFace API token. Please check your token in the .env file.',
                'help': 'Get a free token at https://huggingface.co/settings/tokens'
            }), 401
        elif '429' in error_msg or 'rate' in error_msg.lower():
            return jsonify({
                'error': 'Rate limit exceeded. Please wait a moment and try again.'
            }), 429
        elif '503' in error_msg or 'loading' in error_msg.lower():
            return jsonify({
                'error': 'The model is loading. This may take 1-2 minutes for the first request. Please try again shortly.'
            }), 503
        else:
            return jsonify({
                'error': f'Failed to analyze image: {error_msg}'
            }), 500

@app.route('/api/analyze-pdf', methods=['POST'])
def analyze_pdf():
    """Extract text from an uploaded PDF using PyMuPDF (fitz)."""
    if 'pdf' not in request.files:
        return jsonify({'error': 'No pdf file provided.'}), 400

    file = request.files['pdf']
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Invalid file type. Must be PDF.'}), 400

    try:
        pdf_bytes = file.read()
        doc = fitz.open("pdf", pdf_bytes)
        extracted_text = ""
        for page in doc:
            extracted_text += page.get_text() + "\n"
        doc.close()
        
        result_text = extracted_text.strip()
        if not result_text:
            result_text = "No machine-readable text found in PDF (might be scanned images)."
            
        return jsonify({
            'success': True,
            'result': result_text,
            'model': 'PyMuPDF'
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Failed to parse PDF: {str(e)}'}), 500


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("  Qwen2.5-VL Image-to-Text Web Application")
    print("=" * 60)

    if not HF_API_TOKEN or HF_API_TOKEN == 'your_huggingface_token_here':
        print("\n  ⚠️  WARNING: HuggingFace API token not set!")
        print("  1. Copy .env.example to .env")
        print("  2. Add your token from https://huggingface.co/settings/tokens")
    else:
        print(f"\n  ✅ API Token configured")
        print(f"  📦 Model: {MODEL_ID}")

    print(f"\n  🌐 Open http://localhost:5001 in your browser")
    print("=" * 60 + "\n")

    app.run(host='0.0.0.0', port=5001, debug=True)
