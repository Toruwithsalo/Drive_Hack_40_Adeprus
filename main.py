from flask import Flask, render_template, request, jsonify, send_file
import requests
import json
import urllib3
import base64
import os
import uuid
from datetime import datetime
import logging
import re

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Отключаем предупреждения о неверифицированных SSL-запросах
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)

# Создаем папки если их нет
for folder in ['audio', 'static']:
    if not os.path.exists(folder):
        os.makedirs(folder)

class ChatBot:
    def __init__(self):
        self.gigachat_credentials = "MDE5OWU2ZWQtNzZhYy03NDRiLWI1MzAtMGMzYmMxNDdhZGM0OjNlZDZkMjM3LWM0NDQtNGRjYS1hM2JjLTAwMTA3Y2U1MzQzNg=="
        self.speech_client_id = "0199e720-1cc1-71e5-8fa6-d7864145d056"
        self.speech_client_secret = "4f581ddc-68cd-45c9-ae20-fe550b0155de"

    def get_gigachat_token(self):
        """Получает токен для GigaChat API"""
        try:
            from gigachat import GigaChat
            giga = GigaChat(
                credentials=self.gigachat_credentials,
                verify_ssl_certs=False
            )
            authkeyup = giga.get_token()
            return f"Bearer {authkeyup.access_token}"
        except Exception as e:
            logger.error(f"Ошибка получения токена GigaChat: {e}")
            raise

    def get_speech_token(self):
        """Получает токен для SaluteSpeech API"""
        try:
            url = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
            payload = {'scope': 'SALUTE_SPEECH_PERS'}
            
            credentials = f"{self.speech_client_id}:{self.speech_client_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'RqUID': str(uuid.uuid4()),
                'Authorization': f'Basic {encoded_credentials}'
            }
            
            response = requests.post(url, headers=headers, data=payload, verify=False, timeout=10)
            if response.status_code == 200:
                return response.json().get('access_token')
            else:
                logger.error(f"Ошибка SaluteSpeech: {response.status_code} - {response.text}")
                raise Exception(f"Ошибка получения speech token: {response.status_code}")
        except Exception as e:
            logger.error(f"Ошибка получения токена Speech: {e}")
            raise

    def ask_gigachat(self, question, auth_token):
        """Отправляет вопрос в GigaChat и возвращает ответ"""
        try:
            API_URL = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
            headers = {
                "Authorization": auth_token,
                "Content-Type": "application/json"
            }
            
            system_prompt = """Ты - помощник в образовательном учреждении. Отвечай на вопросы студентов и абитуриентов вежливо и информативно. 
            Будь кратким, но содержательным. Если не знаешь точного ответа, предложи обратиться в деканат."""

            payload = {
                "model": "GigaChat",
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": question
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 500
            }

            response = requests.post(API_URL, headers=headers, 
                                   data=json.dumps(payload), verify=False, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content']
            else:
                logger.error(f"GigaChat API error: {response.status_code} - {response.text}")
                raise Exception(f"Ошибка GigaChat API: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Ошибка обращения к GigaChat: {e}")
            raise

    def generate_speech(self, text, speech_token):
        """Генерирует аудио из текста через Sber SaluteSpeech API"""
        try:
            # Ограничиваем длину текста для синтеза и убираем спецсимволы
            if len(text) > 500:
                text = text[:500] + "..."
            
            # Очищаем текст от Markdown и специальных символов
            text = re.sub(r'[**]', '', text)  # Убираем **
            text = re.sub(r'[*]', '', text)   # Убираем *
            text = re.sub(r'`', '', text)     # Убираем `
            text = re.sub(r'#', '', text)     # Убираем #
            
            url = "https://smartspeech.sber.ru/rest/v1/text:synthesize"
            
            # ИСПРАВЛЕНИЕ: Правильный Content-Type для SaluteSpeech API
            headers = {
                "Authorization": f"Bearer {speech_token}",
                "Content-Type": "application/text"  # БЫЛО: "text/plain; charset=utf-8"
            }
            
            params = {
                "format": "wav16",
                "voice": "Nec_24000",
                "speed": 1.0,
                "emotion": "neutral"
            }

            # ИСПРАВЛЕНИЕ: Передаем текст как строку, а не байты
            response = requests.post(
                url, 
                headers=headers,
                params=params,
                data=text,  # БЫЛО: data=text.encode('utf-8')
                timeout=30,
                verify=False
            )
            
            if response.status_code == 200:
                filename = f"{uuid.uuid4().hex}.wav"
                filepath = os.path.join('audio', filename)
                
                with open(filepath, "wb") as f:
                    f.write(response.content)
                
                logger.info(f"Аудио успешно сохранено: {filename}")
                return filename
            else:
                logger.error(f"SaluteSpeech API error: {response.status_code} - {response.text}")
                return None
            
        except Exception as e:
            logger.error(f"Ошибка генерации речи: {e}")
            return None

chat_bot = ChatBot()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chat/text', methods=['POST'])
def chat_text():
    try:
        data = request.get_json()
        question = data.get('query', '').strip()
        
        if not question:
            return jsonify({'error': 'Пустой запрос'}), 400
        
        logger.info(f"Обработка вопроса: {question}")
        
        # Получаем токены
        gigachat_token = chat_bot.get_gigachat_token()
        speech_token = chat_bot.get_speech_token()
        
        # Получаем ответ от GigaChat
        answer = chat_bot.ask_gigachat(question, gigachat_token)
        
        # Генерируем аудио
        audio_filename = chat_bot.generate_speech(answer, speech_token)
        audio_url = f"/audio/{audio_filename}" if audio_filename else None
        
        response_data = {
            'textResponse': answer,
            'audioUrl': audio_url,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Ошибка обработки запроса: {e}")
        return jsonify({'error': 'Внутренняя ошибка сервера. Попробуйте еще раз.'}), 500

@app.route('/audio/<filename>')
def get_audio(filename):
    try:
        filepath = os.path.join('audio', filename)
        if os.path.exists(filepath):
            return send_file(filepath)
        else:
            return jsonify({'error': 'Аудиофайл не найден'}), 404
    except Exception as e:
        logger.error(f"Ошибка отправки аудио: {e}")
        return jsonify({'error': 'Ошибка загрузки аудио'}), 500

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

def cleanup_old_audio():
    """Очистка старых аудиофайлов"""
    audio_dir = 'audio'
    if os.path.exists(audio_dir):
        now = datetime.now()
        for filename in os.listdir(audio_dir):
            filepath = os.path.join(audio_dir, filename)
            if os.path.isfile(filepath):
                # Удаляем файлы старше 1 часа
                file_time = datetime.fromtimestamp(os.path.getctime(filepath))
                if (now - file_time).total_seconds() > 3600:
                    os.remove(filepath)
                    logger.info(f"Удален старый файл: {filename}")

if __name__ == '__main__':
    cleanup_old_audio()
    logger.info("Запуск Flask приложения...")
    app.run(debug=True, host='0.0.0.0', port=5000)
