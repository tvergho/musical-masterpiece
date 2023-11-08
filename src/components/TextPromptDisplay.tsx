import './TextPromptDisplay.scss';

function TextPromptDisplay({ textPrompt }: { textPrompt: string }) {
  return (
    <div className="text-prompt-display">
      {textPrompt.length > 0 ? textPrompt.slice(0, textPrompt.length - 1) + `...` : ''}
    </div>
  );
}

export default TextPromptDisplay;
