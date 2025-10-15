from salute_speech.speech_recognition import SaluteSpeechClient
import asyncio
import os


async def main():
    # Initialize the client (from environment variable)
    client = SaluteSpeechClient(client_credentials=os.getenv("MDE5OWU3MjAtMWNjMS03MWU1LThmYTYtZDc4NjQxNDVkMDU2OjMyNzc2MWY2LWM4NTItNDVjNC05YzRkLTBjNjkyMjMxZjdkZA=="))

    # Open and transcribe an audio file
    with open("audio.mp3", "rb") as audio_file:
        result = await client.audio.transcriptions.create(
            file=audio_file,
            language="ru-RU"
        )
        print(result.text)


# Run the async function
asyncio.run(main())