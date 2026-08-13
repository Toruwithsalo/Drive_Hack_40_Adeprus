from .auth import TokenManager
from .gigachat import ask_gigachat
from .speech import generate_speech
import logging

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        self.token_manager = TokenManager()

    def process_question(self, question, voice_type='male'):
        try:
            gigachat_token = self.token_manager.get_gigachat_token()
            speech_token = self.token_manager.get_speech_token()

            answer = ask_gigachat(question, gigachat_token)
            audio_filename = generate_speech(answer, speech_token, voice_type)

            return answer, audio_filename
        except Exception as e:
            logger.error(f"Ошибка в ChatService: {e}")
            raise