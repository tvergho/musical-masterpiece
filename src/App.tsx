import { useState, useRef, useEffect } from 'react';
import DrawCanvas from './components/DrawCanvas';
import GeneratedMusic from './components/GeneratedMusic';
import './App.scss';
import { getTextPromptFromImage, startGeneration, stopGeneration } from './api';
import IntroScreen from './components/IntroScreen';

function App() {
  const [showCanvas, setShowCanvas] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [error, setError] = useState(''); // TODO: Implement error handling
  const [textPrompt, setTextPrompt] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startGenerating = async (setText = true, retries = 3) => {
    setError('');

    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width / 4;
    tempCanvas.height = canvas.height / 4;

    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) {
      setError('Could not create temporary canvas context');
      return;
    }

    tempCtx.fillStyle = "#FFFFFF";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, tempCanvas.width, tempCanvas.height);

    // Print new dimensions
    console.log(`New dimensions: ${tempCanvas.width}x${tempCanvas.height}`);

    if (setText) setShowCanvas(false);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const blob: Blob = await new Promise((resolve, reject) => {
          tempCanvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject('Could not create blob from temporary canvas');
            }
          });
        });

        if (!blob) {
          setError('Could not create blob from temporary canvas');
          return;
        }

        const formData = new FormData();
        formData.append('image_file', blob, 'canvasImage.png');

        const textPrompt = await getTextPromptFromImage(formData);
        if (setText) {
          setTextPrompt(textPrompt);
          startGeneration(textPrompt);
        }

        console.log(textPrompt);
        break; // Break out of the loop if successful
      } catch (error) {
        console.log(error);
        if (attempt === retries) {
          // Only set error if all retries failed
          if (setText) setError('There was an error processing your image. Please try again.');
        }
      }
    }
  };

  useEffect(() => {
    if (error.length > 0) {
      setShowCanvas(true);
    }
  }, [error]);

  useEffect(() => {
    // Fixes bug where the API needs to be called once when the app loads due to NGINX annoyingness
    startGenerating(false);
  }, []);

  useEffect(() => {
    const timeouts: number[] = [];

    if (showCanvas || showIntro) {
      stopGeneration();
      setTextPrompt('');
      // Call this a couple more times, staggered
      timeouts.push(setTimeout(() => stopGeneration(), 100));
      timeouts.push(setTimeout(() => stopGeneration(), 2000));
      timeouts.push(setTimeout(() => stopGeneration(), 4000));
      timeouts.push(setTimeout(() => stopGeneration(), 5000));
      timeouts.push(setTimeout(() => stopGeneration(), 7500));
      timeouts.push(setTimeout(() => stopGeneration(), 10000));
    }

    return () => {
      if (!showCanvas && !showIntro) {
        timeouts.forEach((timeout) => clearTimeout(timeout));
      }
    };
  }, [showCanvas, showIntro]);

  if (showIntro) {
    return (
      <IntroScreen onStart={() => setShowIntro(false)} /> 
    );
  }

  return (
    <>
      {(showCanvas || error.length > 0) ? (
        <DrawCanvas canvasRef={canvasRef} startGenerating={() => startGenerating(true)} />
      ) : (
        <GeneratedMusic setError={setError} setShowCanvas={setShowCanvas} textPrompt={textPrompt} />
      )}

      {error.length > 0 && (
        <div className="error">
          {error}
        </div>
      )}
    </>
  );
}

export default App;
