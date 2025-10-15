from gigachat import GigaChat

giga = GigaChat(
   credentials="MDE5OWU2ZWQtNzZhYy03NDRiLWI1MzAtMGMzYmMxNDdhZGM0OjNlZDZkMjM3LWM0NDQtNGRjYS1hM2JjLTAwMTA3Y2U1MzQzNg==", verify_ssl_certs=False
)

response = giga.get_token()

print(response.access_token)