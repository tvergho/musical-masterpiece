import { useCallback, useEffect, useRef, useState } from 'react';
import Lottie from "lottie-react";
import * as API from '../api';
import avatar from '../assets/avatar.png';
import audioAnimationData from '../assets/audio.json';
import loadingAnimationData from '../assets/loading.json';
import DrawAgainButton from './buttons/DrawAgainButton';
import WordCloud from './WordCloud';

function GeneratedMusic({ setError, setShowCanvas, textPrompt }: { setError: (error: string) => void, setShowCanvas: (showCanvas: boolean) => void, textPrompt: string }) {
  const mediaSource = useRef(new MediaSource());
  const sourceBuffer = useRef<SourceBuffer | null>(null);
  const audioElement = useRef(new Audio());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [extractedWords, setExtractedWords] = useState<string[]>([]);

  const startAudioGeneration = useCallback(() => {
    setIsGenerating(true);
    audioElement.current.src = URL.createObjectURL(mediaSource.current);

    // Setup event listener for canplaythrough
    const canPlayHandler = () => {
      audioElement.current.play().catch(e => console.error('Playback failed:', e));
      audioElement.current.removeEventListener('canplaythrough', canPlayHandler);
      setIsPlaying(true);
    };
    audioElement.current.addEventListener('canplaythrough', canPlayHandler);
  }, []);

  useEffect(() => {
    if (isGenerating) {
      mediaSource.current.addEventListener('sourceopen', () => {
        try {
          sourceBuffer.current = mediaSource.current.addSourceBuffer('audio/aac'); // Ensure MIME type is correct
        } catch (e: any) {
          setError('Error creating source buffer: ' + e.message);
          return;
        }
      });

      const pollingInterval = setInterval(async () => {
        try {
          const chunk = await API.fetchAudioChunk();
          if (chunk && sourceBuffer.current && !sourceBuffer.current.updating) {
            sourceBuffer.current.appendBuffer(chunk);
            console.log('Appended audio chunk');
          }
        } catch (error) {
          console.log(error);
          setError('Could not fetch or append audio chunk');
          clearInterval(pollingInterval);
        }

        // Check and remove old data if necessary
        if (sourceBuffer.current && sourceBuffer.current.buffered.length > 0) {
          const bufferStart = sourceBuffer.current.buffered.start(0);
          const bufferEnd = sourceBuffer.current.buffered.end(sourceBuffer.current.buffered.length - 1);
          if (bufferEnd - bufferStart > 60) { // Define a suitable threshold
            sourceBuffer.current.remove(bufferStart, bufferStart + 10); // Define how much duration to remove
          }
        }
      }, 1000);

      return () => {
        clearInterval(pollingInterval);
        if (mediaSource.current.readyState === 'open') {
          mediaSource.current.endOfStream(); // Close the MediaSource when the component unmounts
        }
      };
    }
  }, [isGenerating, setError]);

  useEffect(() => {
    startAudioGeneration();
  }, [startAudioGeneration]);

  const returnToCanvas = () => {
    setIsPlaying(false);
    setIsGenerating(false);
    API.stopGeneration();

    // Stop audio
    audioElement.current.pause();

    setShowCanvas(true);
  };

  useEffect(() => {
    if (textPrompt.length > 0) {
      API.getWordsFromPrompt(textPrompt).then((words) => {
        setExtractedWords(words);
      })
    }
  }, [textPrompt]);

  console.log(extractedWords);

  return (
    <div className={`generated-music-container ${isPlaying ? 'height-restrict' : ''}`}>
      <h2>Here’s your Music Masterpiece....</h2>
      <img src={avatar} alt="Avatar" className="generated-graphic" />

      <div style={{ margin: 'auto' }}>
        {isPlaying ? (
          <Lottie animationData={audioAnimationData} loop={true} />
        ) : (
          <Lottie animationData={loadingAnimationData} loop={true} />
        )}
      </div>
      
      {
        isPlaying && (
          <>
            <WordCloud words={extractedWords} />
            <DrawAgainButton style={{ position: 'absolute', top: '20%', right: '50px', width: '100px', height: '100px' }} onClick={returnToCanvas} />
          </>
        )
      }
    </div>
  );
}

export default GeneratedMusic;
