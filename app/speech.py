import requests
import re
import uuid
import os
import logging
from .config import Config

logger = logging.getLogger(__name__)

def _get_no_proxy_session():
    session = requests.Session()
    session.trust_env = False
    return session

def generate_speech(text, speech_token, voice_type='male'):
    if len(text) > 500:
        text = text[:500] + "..."
    text = re.sub(r'[**#`]', '', text)
    text = re.sub(r'\n+', ' ', text).strip()
    if not text:
        logger.error("Текст для синтеза пуст")
        return None

    voice = 'Dmitry_24000' if voice_type == 'male' else 'May_24000'
    emotion = 'neutral' if voice_type == 'male' else 'friendly'

    url = "https://smartspeech.sber.ru/rest/v1/text:synthesize"
    headers = {
        "Authorization": f"Bearer {speech_token}",
        "Content-Type": "application/text"
    }
    params = {
        "format": "wav16",
        "voice": voice,
        "emotion": emotion,
        "speed": 1.0
    }

    try:
        session = _get_no_proxy_session()
        response = session.post(
            url,
            headers=headers,
            params=params,
            data=text.encode('utf-8'),
            timeout=30,
            verify=False
        )
        if response.status_code == 200:
            os.makedirs(Config.AUDIO_DIR, exist_ok=True)
            filename = f"{uuid.uuid4().hex}.wav"
            filepath = os.path.join(Config.AUDIO_DIR, filename)
            with open(filepath, "wb") as f:
                f.write(response.content)
            logger.info(f"Аудиофайл создан: {filename}")
            return filename
        else:
            logger.error(f"SaluteSpeech error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        logger.error(f"Ошибка генерации речи: {e}")
        return None