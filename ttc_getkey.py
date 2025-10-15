import json

import requests
url = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"

payload={
  'scope': 'SALUTE_SPEECH_PERS'
}
headers = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'Accept': 'application/json',
  'RqUID': '858c790d-f89b-4161-ad23-7d0a5f49a622',
  'Authorization': 'Basic MDE5OWU3MjAtMWNjMS03MWU1LThmYTYtZDc4NjQxNDVkMDU2OmI5ODg2Mjc5LTJkNWUtNDBmMy04Y2U2LTdmNjcxMjc5ZTNkNA=='
}

response = requests.request("POST", url, headers=headers, data=payload, verify=False)
respsplit= "0"

print(response)
print(response.text)
print(respsplit)