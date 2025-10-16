Адептус Механикус, йоу

Для развертывания, скачайте данный репозиторий к себе на компьютер, заранее предустановите Python.
P.S. если консоль не может найти команды python и pip - используйте python3 и pip3

Шаг 1:
  Откройте Командную строку внутри скачанного вами репозитория, создайте виртуальное окружение с помощью команды 
    python -m venv venv

  и войдите в него с помощью:
    На Линукс:
      source venv/bin/activate
    На Windows:
      venv\Scripts\activate.bat
      
Шаг 2:
  Устраните все необходимые зависимости с помощью команды:
  pip install -r requirements.txt

Шаг 3:
Ввести свой Authorization key для Gigachat и Client_id и Client_secret для SaluteSpeech

Шаг 4:
  Запустите локальный сервер и перейдите в браузер по ссылке ниже:
  python main.py

  http://localhost:5000
 
