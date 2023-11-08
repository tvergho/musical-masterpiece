import './WordCloud.scss';

const WordCloud = ({ words }: { words: string[] }) => {
  return (
    <div className="word-cloud-container">
      {words.map((word, index) => (
        <div 
          className={`word-cloud-item word-cloud-item-${index % 5}`} 
          key={index}
        >
          {word}
        </div>
      ))}
    </div>
  );
};

export default WordCloud;
