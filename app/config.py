import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GIGACHAT_CREDENTIALS = os.getenv('GIGACHAT_CREDENTIALS')
    SPEECH_CLIENT_ID = os.getenv('SPEECH_CLIENT_ID')
    SPEECH_CLIENT_SECRET = os.getenv('SPEECH_CLIENT_SECRET')
    AUDIO_DIR = os.getenv('AUDIO_DIR', 'audio')
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

    @classmethod
    def validate(cls):
        if not cls.GIGACHAT_CREDENTIALS:
            raise ValueError("GIGACHAT_CREDENTIALS не задан в .env")
        if not cls.SPEECH_CLIENT_ID or not cls.SPEECH_CLIENT_SECRET:
            raise ValueError("SPEECH_CLIENT_ID и SPEECH_CLIENT_SECRET должны быть заданы")