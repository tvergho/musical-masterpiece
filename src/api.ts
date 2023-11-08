export async function getTextPromptFromImage(formData: FormData): Promise<string> {
  formData.append('system_prompt', 'You are a model that translates the style and mood of the image into a musical description. For instance, musical descriptions you could generate include \'An intimate solo piano nocturne, flowing between gentle melodies and introspective harmonies, reminiscent of moonlit romance.\' or \'Smooth and sophisticated bossa nova jazz, spotlighting a sultry saxophone melody, nylon-string guitar comping, and subtle conga rhythms, ideal for a romantic evening.\'. Emulate the style, length, and descriptive vocabulary of these prompts.');
  formData.append('user_prompt', 'Generate a detailed and descriptive musical description based on the image mood and style. Be creative! Specify the melody, tempo, genre, and style with as many descriptive adjectives as possible. Use text and details in the image to guide the mood.');

  const response = await fetch('/llavaapi/llava', {
      method: 'POST',
      body: formData
  });
  
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  } else {
    return data.content;
  }
}

export async function startGeneration(textPrompt: string): Promise<void> {
  const response = await fetch(`/api/start/${textPrompt}`);
  if (!response.ok) {
    throw new Error(`Failed to initiate generation: ${response.status} ${response.statusText}`);
  }
}

export async function fetchAudioChunk(): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch('/api/poll');

    if (response.ok) {
      const blob = await response.blob();

      if (blob.type.startsWith("audio")) {
        const chunk = await blob.arrayBuffer();
        return chunk;
      }
    } else {
      const data = await response.json();
      console.log(data.message);
      return null;
    }
  } catch (error) {
    console.error("Failed to fetch audio chunk:", error);
    throw error;
  }

  return null;
}

export async function stopGeneration(): Promise<void> {
  await fetch('/api/stop');
}

export async function checkGenerationStatus() {
  const response = await fetch('/api/status');
  const data = await response.json();
  return data.generation_status;
}

export async function startLlavaServer() {
  await fetch('/llavaapi/llava');
}

export async function getWordsFromPrompt(textPrompt: string) {
  // Encode the text prompt to ensure it's safe for URL use
  const encodedPrompt = encodeURIComponent(textPrompt);

  // Append the text prompt as a query parameter
  const url = `/api/extract?text_prompt=${encodedPrompt}`;

  // Fetch the data from the server
  const response = await fetch(url);
  const data = await response.json();

  // Return the extracted words
  return data.words;
}