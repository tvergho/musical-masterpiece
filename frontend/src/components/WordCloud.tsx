import { useEffect, useState } from 'react';
import './WordCloud.scss';

interface WordDimensions {
  width: number;
  height: number;
}

interface WordData extends WordDimensions {
  x: number;
  y: number;
  rotate: number;
}

const WordCloud = ({ words }: { words: string[] }) => {
  // Constants for the word cloud images
  const wordWidth = 300;
  const wordHeight = 200;
  const overlap = 100;  // Allow for 30px overlap
  const maxAttempts = 20000;

  const [placedWords, setPlacedWords] = useState<WordData[]>([]);

  useEffect(() => {
    const newPlacedWords: WordData[] = words.map(() => randomPosition());
    setPlacedWords(newPlacedWords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once


  // Function to generate a random position, accounting for the fixed dimensions and overlap
  const randomPosition = (): WordData => {
    let xPos: number, yPos: number, rotate: number;
    let collision: boolean;
    let isTopExclusion: boolean;
    let isCentralExclusion: boolean;
    let isXExclusion: boolean;
    let attempts = 0;

    do {
      xPos = Math.random() * (100 - ((wordWidth - overlap) / window.innerWidth * 100));
      yPos = Math.random() * (100 - ((wordHeight - overlap) / window.innerHeight * 100));
      rotate = Math.floor(Math.random() * 60) - 30;  // Random rotation from -30deg to 30deg

      // Check exclusion zones
      isTopExclusion = yPos < 10 || yPos > 80;  // Top 30% exclusion
      isCentralExclusion = xPos > 25 && xPos < 60;  // Middle 30% exclusion

      isXExclusion = xPos < 10 || xPos > 80;  // Left 10% and right 10% exclusion

      // Check for collisions with already placed words
      collision = placedWords.some((placedWord) => {
        return (
          xPos + (wordWidth - overlap) / window.innerWidth * 100 > placedWord.x && 
          xPos < placedWord.x + (placedWord.width - overlap) / window.innerWidth * 100 &&
          yPos + (wordHeight - overlap) / window.innerHeight * 100 > placedWord.y && 
          yPos < placedWord.y + (placedWord.height - overlap) / window.innerHeight * 100
        );
      });

      attempts++;
      if (attempts > maxAttempts) {
        // If maximum attempts are exceeded, you can either skip this word or
        // place it at a default position. Here, we are returning a random position instead.
        console.log('Maximum attempts exceeded');
        return { x: Math.random() * 85, y: Math.random() * 85, width: wordWidth, height: wordHeight, rotate: 0 }
      }

    } while (isTopExclusion || isCentralExclusion || collision || isXExclusion);

    // Save the placed word's data
    const wordData: WordData = {
      x: xPos,
      y: yPos,
      width: wordWidth,
      height: wordHeight,
      rotate: rotate
    };
    placedWords.push(wordData);

    return wordData;
  };
  
  return (
    <div className="word-cloud-container">
      {placedWords.map((wordData, index) => {
        const { x, y, rotate } = wordData;
        return (
          <div 
            className="word-cloud-item" 
            key={index}
            style={{ 
              top: `${y}%`, 
              left: `${x}%`, 
              transform: `scale(${1 + index % 5 * 0.1}) rotate(${rotate}deg)` 
            }}
          >
            <div>{words[index]}</div>
          </div>
        );
      })}
    </div>
  );
};

export default WordCloud;
