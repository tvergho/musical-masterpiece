import { useState, useEffect } from 'react';
import avatar from "../assets/avatar.png";

function DrawCanvas({ canvasRef, startGenerating }: { canvasRef: React.RefObject<HTMLCanvasElement>, startGenerating: () => void }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [lineColor, setLineColor] = useState('#3330D0');
  const [lineWidth, setLineWidth] = useState(5);

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
