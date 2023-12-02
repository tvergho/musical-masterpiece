import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { ColorResult, GithubPicker } from 'react-color';
import avatar from "../assets/avatar.png";
import IconButton from './buttons/IconButton';
import CreateIcon from '@mui/icons-material/Edit';
import ClearIcon from '@mui/icons-material/Delete';
import EraserIcon from './buttons/EraserIcon';

function DrawCanvas({ canvasRef, startGenerating }: { canvasRef: React.RefObject<HTMLCanvasElement>, startGenerating: () => void }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [lineColor, setLineColor] = useState('#3330D0');
  const [lineWidth, setLineWidth] = useState(5);
  const [eraserEnabled, setEraserEnabled] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(true);
  const colorPickerRef = useRef<HTMLInputElement>(null);

  // Function to handle color change
  const handleColorChange = (color: ColorResult) => {
    setLineColor(color.hex);
  };

  // Function to open the color picker dialog
  const openColorPicker = () => {
    setShowColorPicker(!showColorPicker);
    if (eraserEnabled) toggleEraser(false);
  };

  useLayoutEffect(() => {
    // If the color picker should be shown, programmatically click the input to open the native color picker dialog
    if (showColorPicker && colorPickerRef.current) {
      colorPickerRef.current.click();
      setShowColorPicker(false); // Prevent multiple triggers
    }
  }, [showColorPicker]);

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const toggleEraser = (setting?: boolean) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context) return;
  
    const newSetting = setting !== undefined ? setting : !eraserEnabled;
    setEraserEnabled(newSetting);
  
    if (newSetting) {
      // When enabling the eraser, we change the composite operation to "destination-out"
      // This will make the drawn areas transparent, achieving the eraser effect.
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = 20; // You might want a bigger lineWidth for eraser
      setLineWidth(20); // Save the lineWidth for pen
    } else {
      // When disabling the eraser (going back to pen), we reset the composite operation to default
      context.globalCompositeOperation = 'source-over';
      setLineWidth(5); // Reset the lineWidth for pen
      context.lineWidth = 5; // Reset to the previous lineWidth for pen
    }
  };

  const getPosition = (canvasDom: HTMLCanvasElement, clientX: number, clientY: number) => {
    const rect = canvasDom.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (x: number, y: number) => {
    if (!canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    context.strokeStyle = lineColor;
    context.lineWidth = lineWidth;
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (x: number, y: number) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  // Touch event handlers
  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const pos = getPosition(canvasRef.current, event.touches[0].clientX, event.touches[0].clientY);
    startDrawing(pos.x, pos.y);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const pos = getPosition(canvasRef.current, event.touches[0].clientX, event.touches[0].clientY);
    draw(pos.x, pos.y);
  };

  // Mouse event handlers
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const pos = getPosition(canvasRef.current, event.clientX, event.clientY);
    startDrawing(pos.x, pos.y);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const pos = getPosition(canvasRef.current, event.clientX, event.clientY);
    draw(pos.x, pos.y);
  };

  const handleMouseUp = () => {
    stopDrawing();
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  return (
    <>
      <div className="canvas-header">
        <img src={avatar} alt="Avatar" className="canvas-graphic" />
        <h2>Draw your feelings, I’ll make ’em sing!</h2>
      </div>
      <canvas
        ref={canvasRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={stopDrawing}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseOut={handleMouseUp} // Stop drawing if the mouse leaves the canvas
        style={{ width: '100%', height: '100%', backgroundColor: '#E2E1F5' }}
        className="draw-canvas"
      />
      <IconButton
        icon={CreateIcon}
        style={{ position: 'absolute', right: '60px', top: '80px' }}
        onClick={openColorPicker}
        className={eraserEnabled ? '' : 'active'} // Highlight the pen button when the eraser is not active
      />
      {showColorPicker && (
        <div style={{ position: 'absolute', right: '160px', top: '130px' }}>
          <GithubPicker
            color={lineColor}
            onChangeComplete={handleColorChange}
            triangle="top-right"
          />
        </div>
      )}
      <IconButton
        icon={() => <EraserIcon className="icon eraser-icon" />}
        style={{ position: 'absolute', right: '60px', top: '200px' }}
        onClick={toggleEraser}
        className={eraserEnabled ? 'active' : ''} // Highlight the eraser button when active
      />
      <IconButton
        icon={ClearIcon}
        style={{ position: 'absolute', right: '60px', top: '320px' }}
        onClick={clearCanvas}
      />
      <button
        onClick={startGenerating}
        className="generate-music-btn"
      >
        MUSIC
      </button>
    </>
  );
}

export default DrawCanvas;
