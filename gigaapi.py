import requests

url = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"

payload={
  'scope': 'GIGACHAT_API_PERS'
}
headers = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'Accept': 'application/json',
  'RqUID': '19adb04b-609b-414c-82e6-8848942ccfc2',
  'Authorization': 'Basic <Authorization key>'
}

response = requests.request("POST", url, headers=headers, data=payload)

print(response.text)