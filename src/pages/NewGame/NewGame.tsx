import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Player } from '../../types/Game';
import { api } from '../../services/api';
import './NewGame.css';

function NewGame() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [registeredPlayers, setRegisteredPlayers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [buyIn, setBuyIn] = useState('');

  useEffect(() => {
    api.getPlayers().then(setRegisteredPlayers);
  }, []);

  const togglePlayer = (playerName: string) => {
    const existingPlayer = players.find(p => p.name === playerName);
    if (existingPlayer) {
      setPlayers(players.filter(p => p.name !== playerName));
    } else {
      setPlayers([...players, { id: Date.now().toString(), name: playerName, buyIn: 0 }]);
    }
  };

  const isPlayerSelected = (playerName: string) => players.some(p => p.name === playerName);

  const createGame = () => {
    if (players.length > 0 && buyIn) {
      const game = {
        id: Date.now().toString(),
        players: players.map(p => p.name),
        buyIn: parseFloat(buyIn),
        createdAt: new Date().toISOString(),
        playerBuyIns: Object.fromEntries(players.map(p => [p.name, 1]))
      };
      navigate('/game-table', { state: game });
    }
  };

  const filteredPlayers = searchTerm.trim()
    ? registeredPlayers.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
    : registeredPlayers;

  return (
    <div className="container">
      <div className="header">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>Back</button>
        <h1>New Game</h1>
      </div>

      <div className="card">
        <h2>Select Players</h2>
        {registeredPlayers.length === 0 ? (
          <p className="no-players">
            No registered players. <a href="/register-players">Register players first</a>
          </p>
        ) : (
          <>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <div className="selected-count">{players.length} selected</div>
            </div>

            <div className="players-chips-container">
              {filteredPlayers.map(player => (
                <div
                  key={player}
                  className={`player-chip ${isPlayerSelected(player) ? 'selected' : ''}`}
                  onClick={() => togglePlayer(player)}
                >
                  {player}
                  {isPlayerSelected(player) && <span className="check-mark">✓</span>}
                </div>
              ))}
            </div>

            {filteredPlayers.length === 0 && searchTerm && (
              <p className="no-results">No players found matching "{searchTerm}"</p>
            )}
          </>
        )}
      </div>

      <div className="card">
        <h2>Buy-in Amount</h2>
        <input
          type="number"
          placeholder="Enter buy-in amount for all players"
          value={buyIn}
          onChange={(e) => setBuyIn(e.target.value)}
        />
      </div>

      <button className="btn btn-primary btn-create" onClick={createGame} disabled={players.length === 0 || !buyIn}>
        Create Game
      </button>
    </div>
  );
}

export default NewGame;
