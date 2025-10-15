import requests
url = "https://gigachat.devices.sberbank.ru/api/v1/models"
payload={}
headers = {
  'Accept': 'application/json',
  'Authorization': "Classsic MDE5OWU2ZWQtNzZhYy03NDRiLWI1MzAtMGMzYmMxNDdhZGM0OjNlZDZkMjM3LWM0NDQtNGRjYS1hM2JjLTAwMTA3Y2U1MzQzNg=="
}
response = requests.get( url, headers=headers, data=payload, verify=False)
print(response)