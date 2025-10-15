import requests
import json
from gigachat import GigaChat
import urllib3



authkey = "0" #"Bearer eyJjdHkiOiJqd3QiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwiYWxnIjoiUlNBLU9BRVAtMjU2In0.CrvMA0cVTRcpR7MUmaxkOd1ZLzEuv53pb3rshMX3mZhK89WMcb9IOW6K_qMpal0kFh0oIKjG8jmTjIGgPmwDoOY-KcszhpqYSGq70yQ4ORRosCJ85tr2Dxm6h7Y8Dpco2cYHy4rN9PD71huB1EKJHApr9wFpkrauEiV07Z6aXfdmaxsJdXVRGeiho0ZwFlrLcbhvkUnjdHBayVaWN_0cfbjWMiPeQjVDCU2VPYgnaQzq4g1RjtnXTuJWaK96r5oZNk1UPSRdmLLrPgDy7zOQrgd1ldvSsnPVAoyQGYOv6nFrj2884r3hYqpurB9zBbeb7YbzdrfVjN3azRTdxpQl4Q.oJpRQM-u5ABC93J1MMb-XQ.-1HNNZ4GbqIfVWjJtDalN0OqmTTYHHI9-SB6pz1B9xfxrTkrnvzfiLxb46PagdrI1NBOS_g9u3Sz0YYJtuJvlNl2bBZy0c4cOSmMUF2Fx4pRvAXAXKlomdBUUfeQpJlqUGzWoFHPtYypryKt6bMJaW_X7hmfvbi_pa1NBAtxOXJZWvTzMK0RlJPIMRBFNRs63WX5m1Et6BtyD9oE4wl8llg4Mzwfm0KPaceemyh5DSeYbiCJrORa1Gju-68WzMnWwXwznHX3doYCH7zlmxqa5-hoYxm233ktO9hOzWXnvYxvqh80njCPYTDrvY5alITQB0kqWqZxRbeRXdyN-fM8_zZso40tgmv-WfKxFBmQLv6e6c1qgGo2KNyHSA_RGkStJMxS-hcFf3-aPIP838WjghPpBNxxhXnuXS5SOJRFshJnAC8Tfd5NpMdGSrmvBy-HY-Mjri3IthvzofEmDe9K8ERJHIId_2GfsgY473j5sYWSO8lnbXex5uyIvOGTH1yHwuYd6moKK3U7htGxzd_ygWIsaQJsy1QSKd_9XBuSwUfssGxmx467OzKwv8H_9TitWVkzWb_xOFJLvwQC8G5bSisCgDxH2OxtNSjoL5n52itiWW6effGUhIGngqZjsuqnr0LiXra3cEq4OK8pO7EMqGzF08QR5223a5a4_qgItpCvQCAxKd7CeyPIES_mnN7vH8JjpR9bc4nrykymTP_uvvjID1GrvN29RFs8MqILILE.bfB9DV5Vpn_fyd6bWyDUBbUSy03V4Lgyw8CIKE3V4qQ"
autttc = "0"
result = "0"
response = "0"
# Отключаем предупреждения о неверифицированных SSL-запросах
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
def TokenVerifier():
    giga = GigaChat(
        credentials="MDE5OWU2ZWQtNzZhYy03NDRiLWI1MzAtMGMzYmMxNDdhZGM0OjNlZDZkMjM3LWM0NDQtNGRjYS1hM2JjLTAwMTA3Y2U1MzQzNg==",
        verify_ssl_certs=False
    )
    authkeyup = giga.get_token()
    print(authkeyup)
    authkey= f"Bearer {authkeyup.access_token}"
    print(authkey)
    return authkey

def Reqhandler(authkey):
    UserRequest = input(str())
    API_URL = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
    HEADERS = {
        "Authorization": f"{authkey}",
        "Content-Type": "application/json"
    }
    PAYLOAD = {
        "model": "GigaChat",
        "messages": [
            {
                "role": "system",
                "content": "Ты помощник, генерируешь тексты."
            },
            {
                "role": "user",
                "content": f"{UserRequest}"
            }
        ]
    }

    response = requests.request("POST", API_URL, headers=HEADERS, data=json.dumps(PAYLOAD), verify=False)
    result = response.json()
    print(result)
    return result
import urllib3

def SpeechToken():
    url = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"

    payload = {
        'scope': 'SALUTE_SPEECH_PERS'
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'RqUID': '858c790d-f89b-4161-ad23-7d0a5f49a622',
        'Authorization': f'MDE5OWU3ODgtM2U1NC03NTk4LTg2ODUtMTJlYzE1NDQ5NGQ5Ojc3NWUxYjcwLTI4Y2EtNDIxYi1hYjdjLTMwNDk0YmNmOWMzNw=='
    }

    response = requests.request("POST", url, headers=headers, data=payload, verify=False)

    print(response.access_token)
    autttc = response.access_token
    return autttc


#Reqhandler(TokenVerifier())
SpeechToken()
#generate_speech(autttc,"BALLS")