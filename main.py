from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import requests
import json
import urllib3
import base64
import os
import uuid
from datetime import datetime, timedelta
import logging
import re
import threading
import time

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Отключаем предупреждения о неверифицированных SSL-запросах
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)
CORS(app)  # Включаем CORS для всех路由

# Создаем папки если их нет
for folder in ['audio', 'static']:
    if not os.path.exists(folder):
        os.makedirs(folder)

class ChatBot:
    def __init__(self):
        # Учетные данные для GigaChat
        self.gigachat_credentials = "MDE5OWU2ZWQtNzZhYy03NDRiLWI1MzAtMGMzYmMxNDdhZGM0OjNlZDZkMjM3LWM0NDQtNGRjYS1hM2JjLTAwMTA3Y2U1MzQzNg=="
        
        # Учетные данные для SaluteSpeech
        self.speech_client_id = "0199e720-1cc1-71e5-8fa6-d7864145d056"
        self.speech_client_secret = "551f777b-5961-41f5-bbbb-2b0bcacd5f8d"
        
        # Кэш токенов
        self.gigachat_token = None
        self.gigachat_token_expires = None
        self.speech_token = None
        self.speech_token_expires = None

    def get_gigachat_token(self):
        """Получает токен для GigaChat API"""
        try:
            # Проверяем, не истек ли текущий токен
            if (self.gigachat_token and self.gigachat_token_expires and 
                datetime.now() < self.gigachat_token_expires):
                return self.gigachat_token

            url = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'RqUID': str(uuid.uuid4()),
                'Authorization': f'Basic {self.gigachat_credentials}'
            }
            data = {'scope': 'GIGACHAT_API_PERS'}
            
            response = requests.post(url, headers=headers, data=data, verify=False, timeout=10)
            
            if response.status_code == 200:
                token_data = response.json()
                access_token = token_data.get('access_token')
                expires_in = token_data.get('expires_in', 1800)  # 30 минут по умолчанию
                
                self.gigachat_token = f"Bearer {access_token}"
                self.gigachat_token_expires = datetime.now() + timedelta(seconds=expires_in - 300)  # -5 минут для запаса
                
                logger.info("GigaChat token получен успешно")
                return self.gigachat_token
            else:
                logger.error(f"Ошибка получения GigaChat token: {response.status_code} - {response.text}")
                raise Exception(f"Ошибка GigaChat API: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Ошибка получения токена GigaChat: {e}")
            raise

    def get_speech_token(self):
        """Получает токен для SaluteSpeech API"""
        try:
            # Проверяем, не истек ли текущий токен
            if (self.speech_token and self.speech_token_expires and 
                datetime.now() < self.speech_token_expires):
                return self.speech_token

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
                token_data = response.json()
                access_token = token_data.get('access_token')
                expires_in = token_data.get('expires_in', 3600)  # 1 час по умолчанию
                
                self.speech_token = access_token
                self.speech_token_expires = datetime.now() + timedelta(seconds=expires_in - 300)  # -5 минут для запаса
                
                logger.info("Speech token получен успешно")
                return self.speech_token
            else:
                logger.error(f"Ошибка получения Speech token: {response.status_code} - {response.text}")
                raise Exception(f"Ошибка Speech API: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Ошибка получения токена Speech: {e}")
            raise

    def ask_gigachat(self, question, auth_token):
        """Отправляет вопрос в GigaChat и возвращает ответ"""
        try:
            API_URL = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
            headers = {
                "Authorization": auth_token,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            system_prompt = """Ты - помощник в образовательном учреждении. Отвечай на вопросы студентов и абитуриентов вежливо, с учетом русской граматики и информативно. 
            Если спросят про метро - расскажи про Московский Метрополитен, о его важности в инфраструктуре Москвы 
            Будь кратким, но содержательным. Если не знаешь точного ответа, предложи обратиться в деканат или дай общую информацию."""

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
                "max_tokens": 500,
                "stream": False
            }

            logger.info(f"Отправка запроса к GigaChat: {question[:100]}...")
            
            response = requests.post(
                API_URL, 
                headers=headers, 
                json=payload, 
                verify=False, 
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                answer = result['choices'][0]['message']['content']
                logger.info(f"Ответ от GigaChat получен: {answer[:100]}...")
                return answer
            else:
                logger.error(f"GigaChat API error: {response.status_code} - {response.text}")
                raise Exception(f"Ошибка GigaChat API: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Ошибка обращения к GigaChat: {e}")
            raise

    def generate_speech(self, text, speech_token, voice_type='female'):
        """Генерирует аудио из текста через Sber SaluteSpeech API"""
        try:
            # Ограничиваем длину текста для синтеза
            if len(text) > 500:
                text = text[:500] + "..."
            
            # Очищаем текст от спецсимволов
            text = re.sub(r'[**#`]', '', text)
            text = re.sub(r'\n+', ' ', text)
            text = text.strip()
            
            if not text:
                logger.error("Текст для синтеза пуст после очистки")
                return None

            # Выбор голоса
            if voice_type == 'male':
                voice = 'Dmitry_24000'
                emotion = 'neutral'
            else:  # female
                voice = 'May_24000'
                emotion = 'friendly'
            
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

            logger.info(f"Генерация речи для текста: {text[:100]}...")
            
            response = requests.post(
                url, 
                headers=headers,
                params=params,
                data=text.encode('utf-8'),
                timeout=30,
                verify=False
            )
            
            if response.status_code == 200:
                filename = f"{uuid.uuid4().hex}.wav"
                filepath = os.path.join('audio', filename)
                
                with open(filepath, "wb") as f:
                    f.write(response.content)
                
                logger.info(f"Аудиофайл создан: {filename}")
                return filename
            else:
                logger.error(f"SaluteSpeech API error: {response.status_code} - {response.text}")
                return None
            
        except Exception as e:
            logger.error(f"Ошибка генерации речи: {e}")
            return None

# Создаем экземпляр бота
chat_bot = ChatBot()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chat/text', methods=['POST', 'OPTIONS'])
def chat_text():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        question = data.get('query', '').strip()
        voice_type = data.get('voice', 'male')
        
        if not question:
            return jsonify({'error': 'Пустой запрос'}), 400
        
        logger.info(f"Обработка вопроса: {question[:100]}..., голос: {voice_type}")
        
        # Получаем токены
        gigachat_token = chat_bot.get_gigachat_token()
        speech_token = chat_bot.get_speech_token()
        
        # Получаем ответ от GigaChat
        answer = chat_bot.ask_gigachat(question, gigachat_token)
        
        # Генерируем аудио
        audio_filename = chat_bot.generate_speech(answer, speech_token, voice_type)
        audio_url = f"/audio/{audio_filename}" if audio_filename else None
        
        response_data = {
            'textResponse': answer,
            'audioUrl': audio_url,
            'timestamp': datetime.now().isoformat(),
            'voiceUsed': voice_type
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Ошибка обработки запроса: {e}")
        return jsonify({'error': 'Внутренняя ошибка сервера'}), 500

@app.route('/audio/<filename>')
def get_audio(filename):
    try:
        # Безопасная проверка имени файла
        if not re.match(r'^[a-f0-9]{32}\.wav$', filename):
            return jsonify({'error': 'Invalid filename'}), 400
            
        filepath = os.path.join('audio', filename)
        if os.path.exists(filepath):
            return send_file(filepath, mimetype='audio/wav')
        else:
            return jsonify({'error': 'Аудиофайл не найден'}), 404
    except Exception as e:
        logger.error(f"Ошибка отправки аудио: {e}")
        return jsonify({'error': 'Ошибка загрузки аудио'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        # Простая проверка здоровья
        return jsonify({
            'status': 'healthy', 
            'timestamp': datetime.now().isoformat(),
            'services': {
                'gigachat': 'available',
                'salutespeech': 'available'
            }
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

def cleanup_old_audio():
    """Очистка старых аудиофайлов"""
    audio_dir = 'audio'
    if os.path.exists(audio_dir):
        now = datetime.now()
        for filename in os.listdir(audio_dir):
            if filename.endswith('.wav'):
                filepath = os.path.join(audio_dir, filename)
                if os.path.isfile(filepath):
                    file_time = datetime.fromtimestamp(os.path.getctime(filepath))
                    if (now - file_time).total_seconds() > 3600:  # 1 час
                        try:
                            os.remove(filepath)
                            logger.info(f"Удален старый файл: {filename}")
                        except Exception as e:
                            logger.error(f"Ошибка удаления файла {filename}: {e}")

@app.before_request
def before_request():
    """Выполняется перед каждым запросом"""
    cleanup_old_audio()

if __name__ == '__main__':
    # Очищаем старые файлы при запуске
    cleanup_old_audio()
    
    logger.info("Запуск Flask приложения...")
    app.run(
        debug=True, 
        host='0.0.0.0', 
        port=5000,
        threaded=True
    )
