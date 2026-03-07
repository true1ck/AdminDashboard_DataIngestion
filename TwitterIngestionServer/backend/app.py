import os
import json
import zipfile
import io
import re
import pandas as pd
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
WHISPER_URL = os.getenv('WHISPER_URL', 'http://localhost:8000')
QWEN_URL = os.getenv('QWEN_URL', 'http://localhost:5001')
OUTPUT_DIR = Path(__file__).parent.parent.parent / "DataCollected" / "twitter"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Registry for switching models easily
MODEL_REGISTRY = {
    "image": {
        "url": f"{QWEN_URL}/api/analyze",
        "type": "vision"
    },
    "audio_video": {
        "url": f"{WHISPER_URL}/api/transcribe",
        "type": "whisper"
    }
}

def process_file_with_model(file_bytes, filename, model_type, custom_prompt=None):
    """Call specialized model servers."""
    target = MODEL_REGISTRY.get(model_type)
    if not target:
        return f"[Error: Unknown model type {model_type}]"
    
    try:
        files = {'image': (filename, file_bytes)} if target['type'] == 'vision' else {'file': (filename, file_bytes)}
        # Note: Whisper server uses 'file' field, Qwen uses 'image'
        
        data = {'prompt': custom_prompt} if custom_prompt else {}
        
        response = requests.post(target['url'], files=files, data=data, timeout=300)
        if response.status_code == 200:
            data = response.json()
            if target['type'] == 'vision':
                return data.get('result', 'No result')
            else:
                return data.get('text', 'No transcription')
        else:
            return f"[Error: Model server returned {response.status_code}]"
    except Exception as e:
        return f"[Error calling {model_type} model: {str(e)}]"

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'service': 'Twitter Ingestion Orchestrator',
        'version': '1.1.0',
        'endpoints': {
            'health': '/api/health',
            'process': '/api/process-twitter'
        }
    }), 200

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'twitter-ingestion'}), 200

@app.route('/api/process-twitter', methods=['POST'])
def process_twitter():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    meta = json.loads(request.form.get('meta', '{}'))
    
    col_text = meta.get('col_text', 'text')
    col_time = meta.get('col_time', 'created_at')
    col_author = meta.get('col_author', 'username')
    col_id = meta.get('col_id', 'id')
    proc_type = meta.get('processing_type', 'text_only') 
    custom_prompt = meta.get('custom_prompt', '')
    custom_cols = meta.get('custom_cols', '')
    extract_all = meta.get('extract_all', False)

    # Patterns for regex heuristics
    patterns = {
        'likes': r"(like|fav|reaction|heart|vote_up)",
        'replies': r"(reply|comment|response|feedback)",
        'shares': r"(retweet|share|repost|forward)"
    }

    def find_col(df, pref, pattern):
        if pref and pref in df.columns: return pref
        for c in df.columns:
            if re.search(pattern, c, re.IGNORECASE):
                return c
        return None

    try:
        results = []
        is_zip = file.filename.lower().endswith('.zip')
        
        # We need to peek at columns to setup heuristics
        # This is handled inside the processing blocks below
        
        if is_zip:
            with zipfile.ZipFile(file, 'r') as z:
                # Find the main data file (CSV or JSON)
                data_file = None
                for name in z.namelist():
                    if name.lower().endswith(('.csv', '.json')) and not name.startswith('__MACOSX'):
                        data_file = name
                        break
                
                if not data_file:
                    return jsonify({'error': 'No CSV or JSON found in ZIP'}), 400
                
                with z.open(data_file) as f:
                    try:
                        if data_file.endswith('.csv'):
                            # Use engine='python' for better error resilience on malformed rows
                            df = pd.read_csv(f, on_bad_lines='skip', engine='python', encoding_errors='replace')
                        else:
                            df = pd.read_json(f)
                    except Exception as e:
                        return jsonify({'error': f"Failed to parse {data_file}: {str(e)}"}), 400
                
                if df.empty:
                    return jsonify({'error': f"The dataset file {data_file} is empty."}), 400
                
                if df.empty:
                    return jsonify({'error': f"The dataset file {data_file} is empty."}), 400
                
                # Heuristics for engagement
                l_col = find_col(df, meta.get('col_likes'), patterns['likes'])
                r_col = find_col(df, meta.get('col_replies'), patterns['replies'])
                s_col = find_col(df, meta.get('col_retweets'), patterns['shares'])

                # Process rows
                for idx, row in df.iterrows():
                    text = str(row.get(col_text, ''))
                    author = str(row.get(col_author, 'Unknown'))
                    timestamp = str(row.get(col_time, ''))
                    tid = str(row.get(col_id, ''))
                    
                    # Engagement & Extra Data
                    engagement_dict = {
                        'Likes': str(row.get(l_col, '0')) if l_col else "N/A",
                        'Replies': str(row.get(r_col, '0')) if r_col else "N/A",
                        'Retweets': str(row.get(s_col, '0')) if s_col else "N/A"
                    }
                    
                    if extract_all:
                        for c in df.columns:
                            if c not in [col_text, col_time, col_author, col_id, l_col, r_col, s_col]:
                                engagement_dict[c] = str(row.get(c, ''))
                    elif custom_cols:
                        for c in [x.strip() for x in custom_cols.split(',') if x.strip()]:
                            if c in df.columns and c not in engagement_dict:
                                engagement_dict[c] = str(row.get(c, ''))

                    eng_str = ", ".join([f"{k}: {v}" for k, v in engagement_dict.items()])

                    entry = f"--- Tweet ID: {tid} | Author: {author} | Date: {timestamp} ---\nOriginal Text: {text}\n"
                    entry += f"Metadata: {eng_str}\n"
                    
                    # Media processing
                    if proc_type != 'text_only':
                        media_file = None
                        media_col = next((c for c in df.columns if 'media' in c.lower() or 'image' in c.lower() or 'video' in c.lower()), None)
                        
                        if media_col and pd.notna(row[media_col]):
                            candidate = str(row[media_col])
                            for zname in z.namelist():
                                if candidate in zname and not zname.endswith(('.csv', '.json')):
                                    media_file = zname
                                    break
                        
                        if media_file:
                            with z.open(media_file) as mf:
                                m_bytes = mf.read()
                                # Enhance prompt if it looks like extraction is requested
                                current_prompt = custom_prompt
                                if not current_prompt:
                                    current_prompt = "Describe the media content."
                                if any(x in current_prompt.lower() for x in ['extract', 'metrics', 'likes', 'replies', 'numbers']):
                                    current_prompt += " Specifically extract and report any visible engagement metrics like likes, comments, or view counts from the media interface."

                                if proc_type == 'text_image':
                                    entry += f"[Image Analysis]: {process_file_with_model(m_bytes, media_file, 'image', custom_prompt=current_prompt)}\n"
                                elif proc_type == 'text_video':
                                    entry += f"[Media Transcription]: {process_file_with_model(m_bytes, media_file, 'audio_video', custom_prompt=current_prompt)}\n"
                    
                    results.append(entry)
        else:
            # Handle plain CSV/JSON upload
            try:
                if file.filename.lower().endswith('.csv'):
                    df = pd.read_csv(file, on_bad_lines='skip', engine='python', encoding_errors='replace')
                else:
                    df = pd.read_json(file)
            except Exception as e:
                 return jsonify({'error': f"Failed to parse uploaded file: {str(e)}"}), 400
            
            if df.empty:
                return jsonify({'error': "The uploaded dataset is empty."}), 400
            
            # Heuristics for plain upload
            l_col = find_col(df, meta.get('col_likes'), patterns['likes'])
            r_col = find_col(df, meta.get('col_replies'), patterns['replies'])
            s_col = find_col(df, meta.get('col_retweets'), patterns['shares'])

            for idx, row in df.iterrows():
                text = str(row.get(col_text, ''))
                author = str(row.get(col_author, 'Unknown'))
                timestamp = str(row.get(col_time, ''))
                tid = str(row.get(col_id, ''))
                
                engagement_dict = {
                    'Likes': str(row.get(l_col, '0')) if l_col else "N/A",
                    'Replies': str(row.get(r_col, '0')) if r_col else "N/A",
                    'Retweets': str(row.get(s_col, '0')) if s_col else "N/A"
                }
                
                if extract_all:
                    for c in df.columns:
                        if c not in [col_text, col_time, col_author, col_id, l_col, r_col, s_col]:
                            engagement_dict[c] = str(row.get(c, ''))
                elif custom_cols:
                    for c in [x.strip() for x in custom_cols.split(',') if x.strip()]:
                        if c in df.columns and c not in engagement_dict:
                            engagement_dict[c] = str(row.get(c, ''))

                eng_str = ", ".join([f"{k}: {v}" for k, v in engagement_dict.items()])

                results.append(f"--- Tweet ID: {tid} | Author: {author} | Date: {timestamp} ---\nMetadata: {eng_str}\nText: {text}\n")

        # Compile output
        final_content = "\n\n".join(results)
        filename = f"twitter_ingestion_{pd.Timestamp.now().strftime('%Y%p%d_%H%M%S')}.txt"
        save_path = OUTPUT_DIR / filename
        
        with open(save_path, 'w', encoding='utf-8') as f:
            f.write(final_content)
            
        return jsonify({
            'success': True,
            'filename': filename,
            'count': len(results),
            'path': str(save_path)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print(f"Twitter Ingestion Server starting on port 6060...")
    app.run(host='0.0.0.0', port=6060, debug=True)
