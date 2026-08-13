import requests
import base64
import uuid
from datetime import datetime, timedelta
import logging
from .config import Config

logger = logging.getLogger(__name__)

# Создаём сессию, которая не использует системные прокси
def _get_no_proxy_session():
    session = requests.Session()
    session.trust_env = False  # игнорируем http_proxy, https_proxy, all_proxy и т.д.
    return session

class TokenManager:
    def __init__(self):
        self.gigachat_token = None
        self.gigachat_token_expires = None
        self.speech_token = None
        self.speech_token_expires = None

    def get_gigachat_token(self):
        if self.gigachat_token and self.gigachat_token_expires and datetime.now() < self.gigachat_token_expires:
            return self.gigachat_token

        url = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'RqUID': str(uuid.uuid4()),
            'Authorization': f'Basic {Config.GIGACHAT_CREDENTIALS}'
        }
        data = {'scope': 'GIGACHAT_API_PERS'}

        try:
            session = _get_no_proxy_session()
            response = session.post(
                url,
                headers=headers,
                data=data,
                verify=False,
                timeout=10
            )
            if response.status_code == 200:
                token_data = response.json()
                access_token = token_data.get('access_token')
                expires_in = token_data.get('expires_in', 1800)
                self.gigachat_token = f"Bearer {access_token}"
                self.gigachat_token_expires = datetime.now() + timedelta(seconds=expires_in - 300)
                logger.info("GigaChat token получен успешно")
                return self.gigachat_token
            else:
                logger.error(f"Ошибка получения GigaChat token: {response.status_code} - {response.text}")
                raise Exception(f"GigaChat Auth Error: {response.status_code}")
        except Exception as e:
            logger.error(f"Ошибка запроса к GigaChat: {e}")
            raise

    def get_speech_token(self):
        if self.speech_token and self.speech_token_expires and datetime.now() < self.speech_token_expires:
            return self.speech_token

        url = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
        payload = {'scope': 'SALUTE_SPEECH_PERS'}
        credentials = f"{Config.SPEECH_CLIENT_ID}:{Config.SPEECH_CLIENT_SECRET}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'RqUID': str(uuid.uuid4()),
            'Authorization': f'Basic {encoded_credentials}'
        }

        try:
            session = _get_no_proxy_session()
            response = session.post(
                url,
                headers=headers,
                data=payload,
                verify=False,
                timeout=10
            )
            if response.status_code == 200:
                token_data = response.json()
                access_token = token_data.get('access_token')
                expires_in = token_data.get('expires_in', 3600)
                self.speech_token = access_token
                self.speech_token_expires = datetime.now() + timedelta(seconds=expires_in - 300)
                logger.info("Speech token получен успешно")
                return self.speech_token
            else:
                logger.error(f"Ошибка получения Speech token: {response.status_code} - {response.text}")
                raise Exception(f"Speech Auth Error: {response.status_code}")
        except Exception as e:
            logger.error(f"Ошибка запроса к Speech: {e}")
            raise