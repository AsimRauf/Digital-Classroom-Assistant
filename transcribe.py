import sys
import os
from vosk import Model, KaldiRecognizer
import wave

# Ensure the model is loaded
model_path = "models/English"  # Change this to your actual model path
if not os.path.exists(model_path):
    print("Model not found at:", model_path)
    sys.exit(1)

# Load the Vosk model
model = Model(model_path)

# Get audio file path and language
audio_file_path = sys.argv[1]
language = sys.argv[2] if len(sys.argv) > 2 else 'english'

# Open the audio file
wf = wave.open(audio_file_path, "rb")
rec = KaldiRecognizer(model, wf.getframerate())

# Prepare to collect transcription
transcription = ""

# Read and transcribe audio
while True:
    data = wf.readframes(4000)
    if not data:
        break
    if rec.AcceptWaveform(data):
        transcription += rec.Result()
    else:
        transcription += rec.PartialResult()

# Finalize transcription
transcription += rec.FinalResult()

# Print the final transcription result
print(transcription)
