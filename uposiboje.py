import requests
import urllib3

# Отключаем предупреждения о неверифицированных SSL-запросах
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def generate_speech(text: str, output_path: str = "output.wav"):
    """
    Генерирует аудио из текста через Sber SaluteSpeech API

    Args:
        text: Текст для озвучки
        output_path: Путь для сохранения аудиофайла

    Returns:
        bool: Успех операции
    """
    # Параметры запроса
    url = "https://smartspeech.sber.ru/rest/v1/text:synthesize"
    headers = {
        "Authorization": "Bearer eyJjdHkiOiJqd3QiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwiYWxnIjoiUlNBLU9BRVAtMjU2In0.kcWg0ukk4OBsCXOKTKI__kC668iiIoETPykjTREvHVcjKO_SSiyTC5_GKXZ7mGwPosyC0EopnNoawfgOP5a0yqV1gg3Qd3tPIq3ZYIacnI2qXf2AbvEtXiZRbIx5qcxk3wtjiNLcV65Lag8bXoZXM6ceUejAG20hOPrrD0wyS-vMtuFrHtr-e3xhO0_f-XbJu9WJaaTDbGCT8VifRGvscRD9in2URexennUe3l6lt9JknmeI-EtNdrllDNRrmV2dNLPJAyxut4wQUC_IrbBDpxP4Pp-TOKwUV3Lr0r2dEfa8tKNfhgs2y9ZM7mUtiPICm6VTtGeFiSdegsx3F_vaig.wsG8k32uUwJi0_4r_1SLGg.v_glo4tXdyW-fXtM_eG6_nFRF-UoSgCHrv7aSxSAJfsLFuuG4exYeZTf3G5UY2I98PpjTZ63iws69PJNUQrwhAlfhcDYDDnbx8dJQxYE1zjBnXMoi7pJ8OWpswoyFTVMt10PC-rJ60q5dmZnW1hqCm8pPo8dqQBpJC0tD3Bryu-hxu0V9IZAmUm0hXWYWSyRiJLnXB8Au7HyqyRYDVo-NPQS1wgZfrtyDvkwggUPXjuBLxyPO0DkRaFBMJ5IvtwfPyzlEhtMKJOtm_YkFCEO3rKgxs93CKGfo8tnHtqS5_-SnI5ZaRY4JTVxsY9iNrVegCILNRnrHYozWj3NFHhZm7Ah0yHz6450nWeG-J6uW18NT15RoQcAtJgzc9SDAflSO1Yx0pow67vghZnRIrp-BDGiVI2TIV7uNNdf0rR5H7c0wdrD515ZfapD01G0y4nQfgVkmXMhrGJ9qZICN5ODTtPgK4GdlCxNFqwVGCdMtx0s0BQBe299dvQZKYo6osyDJeHZISJoxrrypXJm-A_tbY_xVlRBMZdBNyKabt3GrvTaHcgqaeRptMj8CM8lLTdyI_xUCh-8bsua8nr2B_Y7Z0jnlp7abjB5S3BgBSf5EA976ugjzRpL2JpbrUIInSznmYV5AxoYuVcGDe3NUoGKuyB5jV0ijyBtfF2VYXqzRAHi_j5Dgs6WMFFpCmCR9_eu_Q1IfhlesT9jS4DMXs8A1svs9Lf0LDKWXWdlSSfMguY.SisJEIMaIYZz2iO7SUHJRFr-v_rqhSv__XBqlqdvOZg",
        "Content-Type": "application/text"
    }
    params = {
        "format": "wav16",
        "voice": "May_24000",
        "speed": 1.0,
        "emotion": "neutral"
    }
    try:
        # Отправка запроса с текстом в теле и параметрами в URL
        response = requests.post(
            url,
            headers=headers,
            params=params,
            data=text.encode('utf-8'),  # Текст в теле запроса
            timeout=30,
            verify=False
        )
        response.raise_for_status()

        # Сохранение аудио
        with open(output_path, "wb") as f:
            f.write(response.content)

        print(f"Аудио успешно сохранено как {output_path}")
        return True
    except requests.exceptions.HTTPError as e:
        print(f"HTTP ошибка {e.response.status_code}: {e.response.text}")
        return False
    except Exception as e:
        print(f"Ошибка: {e}")
        return False
    text = input("Введи чо озвучить: ")
    if generate_speech(text):
        print("Озвучка успешно создана!")
    else:
        print("Произошла ошибка при создании озвучки")
if __name__ == "main":
    # Пример использования
    text = input("Введи чо озвучить: ")

    if generate_speech(text):
        print("Озвучка успешно создана!")
    else:
        print("Произошла ошибка при создании озвучки")