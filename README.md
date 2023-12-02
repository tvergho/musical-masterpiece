# Musical Masterpiece Dashboard

This is an interactive dashboard application that was built as part of a human-computer interaction study at Dartmouth. It can interpret user's drawings and translate them into an endless stream of music.

## Installation

### Frontend

The frontend can be installed with `bun`. Simply:

```
cd frontend
bun install
```

Then, to start the frontend:
```
bun run dev
```

This will start an instance of the frontend on port 5173. This won't actually work for generating music without the corresponding backend, but can be used for testing/demoing the canvas and other strictly frontend functionality.

### Backend

There are two parts to the backend: the image-to-text server and text-to-music model. They need to be run separately, and operate on different ports.

**Text-to-music:**
First, the text-to-music model. Install the requirements:
```
pip install transformers flask flask_cors 
pip install nltk 
pip install torch torchaudio 
```

Then, the text-to-music model can be started by simply running:
```
cd backend
python musicgen.py
```

Note that this will download a rather large model the first time the script is run. By default, the script will use the `musicgen-stereo-large` model.

**Image-to-text:**
There are two ways to run the image-to-text model. You can either use a local model that's compatible with `llama.cpp`, or use the OpenAI GPT-4V API if you have an account with access (and a corresponding API key). A good local model to use is [BakLLaVA](https://huggingface.co/mys/ggml_bakllava-1), quantized to Q5_KM. You can follow the instructions in the `llava-cpp-server` README to download and get set up.

To run the model locally (assuming it's already been downloaded):
```
cd backend/llava-cpp-server
git submodule init && git submodule update
make
bin/llava-server -m ggml-model-q5_k.gguf --mmproj mmproj-model-f16.gguf
```

Alternatively, you can use the OpenAI GPT-4V API. To start that server, add your API key to `openai_server.py`. Then, simply:
```
python backend/openai_server.py
```