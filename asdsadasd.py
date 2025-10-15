import requests

url = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"

payload={
  'scope': 'GIGACHAT_API_PERS'
}
headers = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'Accept': 'application/json',
  'RqUID': '0199e6ed-76ac-744b-b530-0c3bc147adc4',
  'Authorization': 'Basic MDE5OWU2ZWQtNzZhYy03NDRiLWI1MzAtMGMzYmMxNDdhZGM0OjNlZDZkMjM3LWM0NDQtNGRjYS1hM2JjLTAwMTA3Y2U1MzQzNg=='
}

response = requests.request("POST", url, headers=headers, data=payload, verify = False)

print(response.text)