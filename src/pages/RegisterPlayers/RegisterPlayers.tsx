import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import './RegisterPlayers.css';

function RegisterPlayers() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<string[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');

  useEffect(() => {
    api.getPlayers().then(setPlayers);
  }, []);

  const addPlayer = async () => {
    if (newPlayerName.trim()) {
      const upperCaseName = newPlayerName.trim().toUpperCase();
      if (players.some(p => p.toUpperCase() === upperCaseName)) {
        alert('Player already registered!');
        return;
      }
      await api.registerPlayer(upperCaseName);
      setPlayers([...players, upperCaseName]);
      setNewPlayerName('');
    }
  };

  const deletePlayer = async (playerName: string) => {
    await api.deletePlayer(playerName);
    setPlayers(players.filter(p => p !== playerName));
  };

  return (
    <div className="container">
      <div className="header">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>Back</button>
        <h1>Register Players</h1>
      </div>

      <div className="card">
        <h2>Add New Player</h2>
        <div className="add-player-form">
          <input
            type="text"
            placeholder="Player Name"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
          />
          <button className="btn btn-primary" onClick={addPlayer}>Register</button>
        </div>
      </div>

      {players.length > 0 && (
        <div className="card">
          <h2>Registered Players ({players.length})</h2>
          <div className="players-grid">
            {players.map(player => (
              <div key={player} className="player-card">
                <span className="player-name">{player}</span>
                <button className="btn-delete-small" onClick={() => deletePlayer(player)}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RegisterPlayers;
