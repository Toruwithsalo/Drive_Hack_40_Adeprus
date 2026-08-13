from flask import Blueprint, request, jsonify, send_file, render_template, current_app
from .services import ChatService
from .utils import cleanup_old_audio
import re
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
bp = Blueprint('main', __name__)

# Инициализация сервиса (глобально, но можно перенести в фабрику)
chat_service = ChatService()

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/api/chat/text', methods=['POST', 'OPTIONS'])
def chat_text():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data'}), 400

        question = data.get('query', '').strip()
        voice_type = data.get('voice', 'male')
        if not question:
            return jsonify({'error': 'Пустой запрос'}), 400

        logger.info(f"Вопрос: {question[:100]}..., голос: {voice_type}")

        answer, audio_filename = chat_service.process_question(question, voice_type)
        audio_url = f"/audio/{audio_filename}" if audio_filename else None

        return jsonify({
            'textResponse': answer,
            'audioUrl': audio_url,
            'timestamp': datetime.now().isoformat(),
            'voiceUsed': voice_type
        })

    except Exception as e:
        logger.error(f"Ошибка в /api/chat/text: {e}")
        return jsonify({'error': 'Внутренняя ошибка сервера'}), 500

@bp.route('/audio/<filename>')
def get_audio(filename):
    if not re.match(r'^[a-f0-9]{32}\.wav$', filename):
        return jsonify({'error': 'Invalid filename'}), 400

    filepath = os.path.join(current_app.config['AUDIO_DIR'], filename)
    if os.path.exists(filepath):
        return send_file(filepath, mimetype='audio/wav')
    else:
        return jsonify({'error': 'Файл не найден'}), 404

@bp.route('/api/health', methods=['GET'])
def health_check():
    try:
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'services': {'gigachat': 'available', 'salutespeech': 'available'}
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500