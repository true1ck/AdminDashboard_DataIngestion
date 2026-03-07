"""
Whisper Transcriber — Uses faster-whisper (CTranslate2) for speech-to-text.
Model: openai/whisper-large-v3 (Apache 2.0)
"""

import os
import subprocess
import tempfile
import logging
from pathlib import Path
from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)

# Video extensions that need audio extraction
VIDEO_EXTENSIONS = {".mp4", ".mkv", ".avi", ".mov", ".webm"}


class WhisperTranscriber:
    """Transcribes audio/video files using OpenAI Whisper large-v3 via faster-whisper."""

    def __init__(self):
        self._model = None
        self.model_name = "large-v3"
        self.device = "cuda" if self._cuda_available() else "cpu"
        self.compute_type = "float16" if self.device == "cuda" else "int8"

    @staticmethod
    def _cuda_available() -> bool:
        try:
            import torch
            return torch.cuda.is_available()
        except ImportError:
            return False

    @property
    def model(self) -> WhisperModel:
        """Lazy-load the Whisper model on first use."""
        if self._model is None:
            logger.info(f"Loading Whisper model '{self.model_name}' on {self.device} ({self.compute_type})...")
            self._model = WhisperModel(
                self.model_name,
                device=self.device,
                compute_type=self.compute_type,
            )
            logger.info("Whisper model loaded successfully.")
        return self._model

    def _extract_audio(self, video_path: str) -> str:
        """Extract audio from video file using FFmpeg."""
        temp_audio = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        temp_audio.close()

        cmd = [
            "ffmpeg", "-i", video_path,
            "-vn", "-acodec", "pcm_s16le",
            "-ar", "16000", "-ac", "1",
            "-y", temp_audio.name,
        ]

        try:
            subprocess.run(cmd, capture_output=True, check=True, timeout=300)
            logger.info(f"Audio extracted to {temp_audio.name}")
            return temp_audio.name
        except subprocess.CalledProcessError as e:
            os.unlink(temp_audio.name)
            raise RuntimeError(f"FFmpeg audio extraction failed: {e.stderr.decode()}")
        except FileNotFoundError:
            os.unlink(temp_audio.name)
            raise RuntimeError("FFmpeg not found. Install it with: brew install ffmpeg")

    def transcribe(self, file_path: str) -> dict:
        """
        Transcribe an audio or video file.

        Returns:
            dict with 'segments' (list of {start, end, text}) and 'full_text' (str)
        """
        ext = Path(file_path).suffix.lower()
        audio_path = file_path
        temp_audio = None

        # Extract audio from video if needed
        if ext in VIDEO_EXTENSIONS:
            logger.info(f"Extracting audio from video: {file_path}")
            audio_path = self._extract_audio(file_path)
            temp_audio = audio_path

        try:
            logger.info("Starting Whisper transcription...")
            segments_gen, info = self.model.transcribe(
                audio_path,
                beam_size=5,
                language=None,  # Auto-detect language
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=500),
            )

            segments = []
            full_text_parts = []

            for segment in segments_gen:
                seg_data = {
                    "start": round(segment.start, 2),
                    "end": round(segment.end, 2),
                    "text": segment.text.strip(),
                }
                segments.append(seg_data)
                full_text_parts.append(segment.text.strip())

            full_text = " ".join(full_text_parts)

            logger.info(
                f"Transcription complete: {len(segments)} segments, "
                f"language={info.language} (prob={info.language_probability:.2f})"
            )

            return {
                "segments": segments,
                "full_text": full_text,
                "language": info.language,
                "language_probability": round(info.language_probability, 2),
                "duration": round(info.duration, 2),
                "model": "openai/whisper-large-v3",
            }

        finally:
            # Clean up temp audio file
            if temp_audio and os.path.exists(temp_audio):
                os.unlink(temp_audio)
