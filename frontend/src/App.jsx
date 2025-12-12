import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_URL = 'http://localhost:4000/api/game/action';

// --- Image Modal Component ---
const ImageModal = ({ src, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="Event" />
        <button className="close-button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};


function App() {
  const [gameState, setGameState] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEventImage, setShowEventImage] = useState(true);
  const [playerInputText, setPlayerInputText] = useState("");

  const narrativeLogRef = useRef(null);

  useEffect(() => {
    narrativeLogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [gameState?.narrativeLog]);

  const sendAction = async (action, payload = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, gameState }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const newGameState = await response.json();
      setGameState(newGameState);
      
      if (newGameState.eventImageUrl) {
        setShowEventImage(true);
      }

    } catch (e) {
      setError(e.message);
      console.error("發生錯誤:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = () => {
    if (playerName.trim()) sendAction('START_GAME', { playerName });
    else alert('請輸入你的名字。');
  };

  const handlePlayerTalk = () => {
    if (playerInputText.trim() && !isLoading) {
      sendAction('PLAYER_TALK', { text: playerInputText });
      setPlayerInputText(""); // Clear input after sending
    }
  };

  const renderPlayerInput = () => {
    if (gameState.phase === 'discussion') {
      return (
        <div className="player-input-area">
          <input 
            type="text" 
            placeholder="輸入你的發言..." 
            value={playerInputText}
            onChange={(e) => setPlayerInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handlePlayerTalk()}
            disabled={isLoading} 
          />
          <button onClick={handlePlayerTalk} disabled={isLoading}>
            {isLoading ? 'AI 正在思考...' : '發言'}
          </button>
        </div>
      );
    }
    if (gameState.phase === 'voting') {
      return (
        <div className="player-input-area voting">
          <p>投票階段：選擇一位玩家投票</p>
          {gameState.survivors.filter(name => name !== gameState.characters.find(c => c.isHuman).name).map(name => (
            <button key={name} disabled={isLoading} onClick={() => alert(`(功能開發中) 你投票給了 ${name}`)}>
              {name}
            </button>
          ))}
        </div>
      );
    }
    return null; // No input in other phases for now
  };


  // --- Render Functions ---

  const renderLobby = () => (
    <div className="lobby-container">
      <h1>AI 狼人殺</h1>
      <p>一場單人敘事體驗</p>
      <input
        type="text"
        placeholder="請輸入你的名字"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleStartGame()}
        disabled={isLoading}
      />
      <button onClick={handleStartGame} disabled={isLoading}>
        {isLoading ? '正在生成你的故事...' : '開始你的故事'}
      </button>
      {error && <p className="error-message">錯誤: {error}</p>}
    </div>
  );

  const renderGame = () => {
    if (!gameState) return <p>正在載入遊戲狀態...</p>;
    
    const { characters, survivors, narrativeLog, imageUrl, eventImageUrl, day, phase } = gameState;
    const humanPlayer = characters.find(c => c.isHuman);

    return (
      <>
        {eventImageUrl && showEventImage && (
          <ImageModal src={eventImageUrl} onClose={() => setShowEventImage(false)} />
        )}

        <div className="game-container">
          <aside className="sidebar">
            <h2>存活者 ({survivors.length}/{characters.length})</h2>
            <ul>
              {characters.map(char => (
                <li key={char.name} className={char.status === 'dead' ? 'dead' : 'alive'}>
                  {char.name}
                  {char.isHuman && <span> (你, {humanPlayer.role})</span>}
                </li>
              ))}
            </ul>
            <div className="game-info">
              <p>天數: {day}</p>
              <p>階段: {phase}</p>
            </div>
          </aside>

          <main className="main-content">
            <div className="illustration-area">
              {isLoading && <div className="loading-overlay">正在生成新場景...</div>}
              {imageUrl ? <img src={imageUrl} alt="AI 生成的遊戲場景" /> : <div className="placeholder-image"><p>正在生成圖片...</p></div>}
            </div>
            <div className="narrative-log">
              {narrativeLog.map((entry, index) => (
                <div key={index} className={`log-entry ${entry.sender.toLowerCase()}`}><strong>{entry.sender}:</strong><p>{entry.message}</p></div>
              ))}
              <div ref={narrativeLogRef} />
            </div>
            {renderPlayerInput()}
            {error && <p className="error-message">錯誤: {error}</p>}
          </main>
        </div>
      </>
    );
  };

  return <div className="App">{gameState ? renderGame() : renderLobby()}</div>;
}

export default App;
