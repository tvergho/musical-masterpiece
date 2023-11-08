import avatar from "../assets/avatar.png";

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="intro-screen">
      <div className="intro-content">
        <img src={avatar} alt="Intro Graphic" className="intro-graphic" />
        <div>
          <h1>Let's Turn your Imagination into</h1>
          <h2>Musical Masterpiece</h2>
        </div>
      </div>

      <button onClick={onStart} className="start-button">START</button>
    </div>
  );
}

export default IntroScreen;
