import './buttons.scss';
import ReplayIcon from '@mui/icons-material/Replay';

function DrawAgainButton({ style, onClick }: { style?: React.CSSProperties, onClick: () => void }) {
  return (
    <div className="draw-again-container" style={style} onClick={onClick}>
      <div className="circle"></div>
      <ReplayIcon className="replay-icon" />
    </div>
  );
}

export default DrawAgainButton;
