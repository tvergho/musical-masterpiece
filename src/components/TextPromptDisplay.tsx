import './TextPromptDisplay.scss';

function TextPromptDisplay({ textPrompt }: { textPrompt: string }) {
  return (
    <div className="text-prompt-display">
      {textPrompt}
    </div>
  );
}

export default TextPromptDisplay;
