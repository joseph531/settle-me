import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameSession } from '../../types/GameSession';
import { api } from '../../services/api';
import './ExistingGames.css';

function ExistingGames() {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameSession[]>([]);

  useEffect(() => {
    api.getGames().then(data => setGames(data as GameSession[]));
  }, []);

  const openGame = (game: GameSession) => {
    const readOnly = game.status === 'finalized';
    navigate('/game-table', { state: { ...game, readOnly } });
  };

  const deleteGame = async (gameId: string) => {
    await api.deleteGame(gameId);
    setGames(games.filter(g => g.id !== gameId));
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  return (
    <div className="container">
      <div className="header">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>Back</button>
        <h1>Existing Games</h1>
      </div>

      {games.length === 0 ? (
        <div className="card">
          <p className="no-games">No saved games yet. Create a new game to get started!</p>
        </div>
      ) : (
        <div className="games-grid">
          {games.map(game => (
            <div key={game.id} className={`game-card ${game.status === 'in-progress' ? 'in-progress' : 'finalized'}`}>
              <div className="game-status-badge">
                {game.status === 'in-progress' ? 'In Progress' : 'Finalized'}
              </div>
              <h3>{game.gameName || `${game.players.length} Players`}</h3>
              <p className="game-info">Buy-in: ${game.buyIn}</p>
              <p className="game-info">Players: {game.players.join(', ')}</p>
              <p className="game-date">Saved: {formatDate(game.savedAt || game.createdAt)}</p>
              <div className="game-actions">
                <button className="btn btn-primary" onClick={() => openGame(game)}>
                  {game.status === 'in-progress' ? 'Continue' : 'View'}
                </button>
                <button className="btn-delete" onClick={() => deleteGame(game.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExistingGames;
