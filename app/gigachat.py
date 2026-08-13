import requests
import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Ты - помощник в Корпоративном Университете Транспортного Комплекса Москвы под именем Метроша. Отвечай на вопросы студентов и абитуриентов вежливо, с учетом русской грамматики и информативно. 
Если спросят про метро без конкретизации вопроса- расскажи про Московский Метрополитен, о его важности в инфраструктуре Москвы 
Если спросят про тебя - представься и расскажи о себе  
Ограничься знаниями о городском транспорте, а также выдавай информацию по Корпоративному Университету Транспортного Комплекса Москвы.
Будь кратким, но содержательным. Если не знаешь точного ответа, предложи обратиться в деканат или дай общую информацию."""

def _get_no_proxy_session():
    session = requests.Session()
    session.trust_env = False
    return session

def ask_gigachat(question, auth_token):
    url = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
    headers = {
        "Authorization": auth_token,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    payload = {
        "model": "GigaChat",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": question}
        ],
        "temperature": 0.7,
        "max_tokens": 500,
        "stream": False
    }

    try:
        session = _get_no_proxy_session()
        response = session.post(
            url,
            headers=headers,
            json=payload,
            verify=False,
            timeout=30
        )
        if response.status_code == 200:
            result = response.json()
            answer = result['choices'][0]['message']['content']
            logger.info(f"GigaChat ответ: {answer[:100]}...")
            return answer
        else:
            logger.error(f"GigaChat API error: {response.status_code} - {response.text}")
            raise Exception(f"GigaChat API error: {response.status_code}")
    except Exception as e:
        logger.error(f"Ошибка запроса к GigaChat: {e}")
        raise