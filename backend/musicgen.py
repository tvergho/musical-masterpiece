import sys
import io
from flask import Flask, Response, jsonify, request
from transformers import MusicgenForConditionalGeneration, AutoProcessor
import nltk
from nltk.tokenize import word_tokenize
from nltk.tag import pos_tag
import torchaudio
import io
import torch
from flask_cors import CORS
import threading
from queue import Queue
import time
import ffmpeg

MODEL_NAME = "facebook/musicgen-stereo-large"
device = torch.device("cuda:0")
chunks_queue = Queue()
last_5_seconds = None

audio_duration = 10
tokens_for_duration = int((audio_duration / 10) * 512)  # Proportional tokens for the given duration
samples_for_5_seconds = int((audio_duration / 10) * 80000)  # Proportional samples for the last 5 seconds

generation_in_progress = False  # Global flag to check if a generation process is ongoing
stop_generation_flag = False  # Flag to stop the current generation process
current_text_prompt = None  # Global variable to store the current text prompt
returned_prompt = None

last_poll_time = None
POLL_TIMEOUT_SECONDS = 30

# This class is used to make sure that only one instance of the model is loaded, even if the Flask app is reloaded
class Singleton(type):
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            instance = super().__call__(*args, **kwargs)
            cls._instances[cls] = instance
        return cls._instances[cls]

class MusicGen(metaclass=Singleton):
    def __init__(self):
      self.processor = AutoProcessor.from_pretrained(MODEL_NAME)
      self.model = MusicgenForConditionalGeneration.from_pretrained(MODEL_NAME, torch_dtype=torch.float16, device_map="cuda:0", torchscript=True)
      self.model.to(device)
      self.model.eval()
      print("Model loaded")

    def process_synthesis_result(self, result):
        """
        Convert tensor to mp4 byte stream.
        """
        # Convert the tensor to WAV first
        with io.BytesIO() as wav_buffer:
            torchaudio.save(wav_buffer, result, 32000, format="wav")
            wav_buffer.seek(0)
            
            # Convert WAV to MP4
            audio_input = ffmpeg.input('pipe:0')
            audio_output = ffmpeg.output(audio_input, 'pipe:1', format='adts', acodec='aac', ar='32000')
            try:
                out, err = ffmpeg.run(audio_output, input=wav_buffer.read(), capture_stdout=True, capture_stderr=True)
            except ffmpeg.Error as e:
                print(f"FFmpeg stderr:\n{e.stderr.decode()}")
                raise
            
        return out

    def generate(self, text_prompt, audio_prompt=None, max_new_tokens=tokens_for_duration):
      if not audio_prompt:
          inputs = self.processor(
              text=[text_prompt],
              padding=True,
              return_tensors="pt",
          )
      else:
          waveform = torch.tensor(audio_prompt).squeeze(1).squeeze(0).float().half()
          inputs = self.processor(
              audio=waveform,
              sampling_rate=32000,
              text=[text_prompt],
              padding=True,
              return_tensors="pt",
          )

      inputs = inputs.to(device)

      if "input_values" in inputs:
       inputs['input_values'] = inputs['input_values'].half()

      wav_tensor = self.model.generate(**inputs, max_new_tokens=max_new_tokens, guidance_scale=7)
      wav_tensor = wav_tensor.cpu().squeeze(0).float()
      quarter_length = len(wav_tensor[0]) // 8
      last_5_seconds = wav_tensor[:, -quarter_length:].tolist()
      print(f"last_5_seconds_len: {len(last_5_seconds[0])}")
        
      # Omit the initial part of wav_tensor equivalent to the length of the waveform
      if audio_prompt:
            wav_tensor = wav_tensor[:, len(last_5_seconds[0]):]

      wav = self.process_synthesis_result(wav_tensor)
      return wav, last_5_seconds

app = Flask(__name__)
CORS(app)
model = MusicGen()

def background_generation():
    global last_5_seconds, current_text_prompt, stop_generation_flag, last_poll_time
    while True:
        # Check if the poll timeout has been exceeded
        if last_poll_time and (time.time() - last_poll_time > POLL_TIMEOUT_SECONDS):
            stop_generation()
            break

        # Stop the generation if the flag is set
        if stop_generation_flag:
            break
        
        # Check if there's a new text prompt
        text_prompt = current_text_prompt

        print(f"Generating for {text_prompt}")
        
        if last_5_seconds:
            wav_bytestring, last_5_seconds_list = model.generate(text_prompt, audio_prompt=last_5_seconds)
        else:
            wav_bytestring, last_5_seconds_list = model.generate(text_prompt)

        print(f"Generated {audio_duration} seconds of music")
        chunks_queue.put((wav_bytestring, text_prompt))
        last_5_seconds = last_5_seconds_list

@app.route("/start/<text_prompt>")
def start_generation(text_prompt):
    global generation_in_progress, stop_generation_flag, current_text_prompt
    if generation_in_progress:
        return jsonify({"message": "Generation is already in progress. Try again later."})
    
    print(f"Starting generation for {text_prompt}")
    
    generation_in_progress = True
    stop_generation_flag = False
    current_text_prompt = text_prompt

    t = threading.Thread(target=background_generation)
    t.start()

    return jsonify({"message": "Generation started."})

@app.route("/stop")
def stop_generation():
    global generation_in_progress, stop_generation_flag, chunks_queue, last_5_seconds, returned_prompt
    stop_generation_flag = True
    generation_in_progress = False

    # Clear queue
    chunks_queue = Queue()
    last_5_seconds = None
    returned_prompt = None
    return jsonify({"message": "Generation stopped."})

@app.route("/poll")
def poll_audio_chunk():
    global current_text_prompt, returned_prompt, last_poll_time
    new_text_prompt = request.args.get('text_prompt')
    
    if new_text_prompt:
        current_text_prompt = new_text_prompt

    last_poll_time = time.time()  # Reset the poll timer

    if not chunks_queue.empty():
        next_chunk, associated_prompt = chunks_queue.get()
        returned_prompt = associated_prompt
        return Response(next_chunk, content_type="audio/aac")
    else:
        return jsonify({"message": "No audio chunk available right now."})

@app.route("/get_current_prompt")
def get_current_prompt():
    global returned_prompt
    return jsonify({"current_prompt": returned_prompt})

@app.route("/status")
def check_generation_status():
    global generation_in_progress
    status = "in progress" if generation_in_progress else "not in progress"
    return jsonify({"generation_status": status})

# Function for Word Extraction
def extract_words(paragraph):
    # Define lists of words to include or exclude
    color_words = ["black", "white", "red", "blue", "green", "yellow", "purple", "orange", "brown", "pink", "gray", "grey", "beige", "cream"]
    musical_instruments = ["piano", "guitar", "violin", "drums", "flute", "saxophone", "trumpet", "cello", "clarinet", "harp", "drum", "ukulele"]
    other_words = ["such", "overall"]

    excluded_words = color_words + other_words

    # Tokenize and POS Tagging
    tokens = word_tokenize(paragraph)
    tagged = pos_tag(tokens)

    # Extract Words
    words = [word.lower() for word, tag in tagged if (tag in ["JJ", "JJR", "JJS"] and word.lower() not in excluded_words) or word.lower() in musical_instruments]
    return list(set(words))

# Route for Processing Text Prompt
@app.route("/extract")
def process_prompt():
    text_prompt = request.args.get('text_prompt', '')
    words = extract_words(text_prompt)
    return jsonify({"words": words})

if __name__ == "__main__":
    app.run(host="0.0.0.0")
