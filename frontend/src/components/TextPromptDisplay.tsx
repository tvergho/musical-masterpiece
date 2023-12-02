import './TextPromptDisplay.scss';

function TextPromptDisplay({ textPrompt }: { textPrompt: string }) {
  return (
    <div className="text-prompt">
      <div className="text-prompt-display">
        {textPrompt.length > 0 ? textPrompt.slice(0, textPrompt.length - 1) + `...` : ''}
      </div>
      <div className="text-prompt-info">Creating tune from your art! Music's on its way....</div>
    </div>
  );
}

export default TextPromptDisplay;
