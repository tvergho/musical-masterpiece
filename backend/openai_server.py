from flask import Flask, request, jsonify
import base64
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
api_key = "YOUR_API_KEY_HERE"

# Function to encode the image
def encode_image(image_file):
  return base64.b64encode(image_file.read()).decode('utf-8')

@app.route('/llava', methods=['POST'])
def llava():
    image_file = request.files['image_file']
    base64_image = encode_image(image_file)

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    payload = {
        "model": "gpt-4-vision-preview",
        "messages": [
          {
            "role": "system",
            "content": [
              {
                "type": "text",
                "text": "You translate the style and mood of the image into a musical description. For instance, musical descriptions you could generate include \'An intimate solo piano nocturne, flowing between gentle melodies and introspective harmonies, reminiscent of moonlit romance.\' or \'Smooth and sophisticated bossa nova jazz, spotlighting a sultry saxophone melody, nylon-string guitar comping, and subtle conga rhythms, ideal for a romantic evening.\'. Emulate the style, length, and descriptive vocabulary of these prompts."
              }
            ]
          },
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": "Generate a detailed and descriptive musical description based on the image mood and style. Be creative! Specify the melody, tempo, genre, and style with as many descriptive adjectives as possible. Use text and details in the image to guide the mood. It should be 2-3 sentences."
              },
              {
                "type": "image_url",
                "image_url": {
                  "url": f"data:image/png;base64,{base64_image}",
                  "detail": "high"
                },
              }
            ]
          }
        ],
        "max_tokens": 300
    }

    response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
    response = response.json()
    print(response)

    output = response['choices'][0]['message']['content']
    print(output)

    return jsonify({"content": output})

if __name__ == '__main__':
    app.run(port=8080)
