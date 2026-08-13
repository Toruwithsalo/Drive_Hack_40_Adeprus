import os
import logging
from datetime import datetime
from .config import Config

logger = logging.getLogger(__name__)

def cleanup_old_audio(audio_dir=None):
    if audio_dir is None:
        audio_dir = Config.AUDIO_DIR
    if not os.path.exists(audio_dir):
        return
    now = datetime.now()
    for filename in os.listdir(audio_dir):
        if filename.endswith('.wav'):
            filepath = os.path.join(audio_dir, filename)
            try:
                if os.path.isfile(filepath):
                    file_time = datetime.fromtimestamp(os.path.getctime(filepath))
                    if (now - file_time).total_seconds() > 3600:  # старше 1 часа
                        os.remove(filepath)
                        logger.info(f"Удалён старый аудиофайл: {filename}")
            except Exception as e:
                logger.error(f"Ошибка удаления {filename}: {e}")