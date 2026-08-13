from flask import Flask
from .config import Config
from .routes import bp
from .utils import cleanup_old_audio
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_app():
    Config.validate()  # проверяем наличие обязательных переменных

    app = Flask(__name__, static_folder='../static', template_folder='../templates')
    app.config.from_object(Config)

    # Очистка старых аудио при старте
    cleanup_old_audio(app.config['AUDIO_DIR'])

    app.register_blueprint(bp)
    return app