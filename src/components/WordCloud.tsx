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
  const overlap = 75;  // Allow for 30px overlap
  const placedWords: WordData[] = [];

  // Function to generate a random position, accounting for the fixed dimensions and overlap
  const randomPosition = (): WordData => {
    let xPos: number, yPos: number, rotate: number;
    let collision: boolean;
    let isTopExclusion: boolean;
    let isCentralExclusion: boolean;
    let isXExclusion: boolean;

    do {
      xPos = Math.random() * (100 - ((wordWidth - overlap) / window.innerWidth * 100));
      yPos = Math.random() * (100 - ((wordHeight - overlap) / window.innerHeight * 100));
      rotate = Math.floor(Math.random() * 60) - 30;  // Random rotation from -30deg to 30deg

      // Check exclusion zones
      isTopExclusion = yPos < 10 || yPos > 80;  // Top 30% exclusion
      isCentralExclusion = xPos > 25 && xPos < 60;  // Middle 30% exclusion

      isXExclusion = xPos < 15 || xPos > 80;  // Left 10% and right 10% exclusion

      // Check for collisions with already placed words
      collision = placedWords.some((placedWord) => {
        return (
          xPos + (wordWidth - overlap) / window.innerWidth * 100 > placedWord.x && 
          xPos < placedWord.x + (placedWord.width - overlap) / window.innerWidth * 100 &&
          yPos + (wordHeight - overlap) / window.innerHeight * 100 > placedWord.y && 
          yPos < placedWord.y + (placedWord.height - overlap) / window.innerHeight * 100
        );
      });

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
      {words.map((word, index) => {
        const { x, y, rotate } = randomPosition();
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
            <div>{word}</div>
          </div>
        );
      })}
    </div>
  );
};

export default WordCloud;
