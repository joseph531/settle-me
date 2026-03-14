import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import type { GameSession } from '../../types/GameSession';
import { api } from '../../services/api';
import './AdminUserDetail.css';

interface PlayerStats {
  name: string;
  totalWinnings: number;
  gamesPlayed: number;
}

function AdminUserDetail() {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username = (location.state as { username: string })?.username || 'User';
  const [games, setGames] = useState<GameSession[]>([]);
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [tab, setTab] = useState<'games' | 'leaderboard'>('games');

  useEffect(() => {
    api.getGames(Number(userId)).then(data => {
      const allGames = data as GameSession[];
      setGames(allGames);

      const finalizedGames = allGames.filter(g => g.status === 'finalized');
      const stats: { [name: string]: PlayerStats } = {};
      finalizedGames.forEach(game => {
        game.players.forEach(player => {
          if (!stats[player]) stats[player] = { name: player, totalWinnings: 0, gamesPlayed: 0 };
          const settlement = ((game.cashouts?.[player] || 0) * game.buyIn) - ((game.playerBuyIns[player] || 0) * game.buyIn);
          stats[player].totalWinnings += settlement;
          stats[player].gamesPlayed += 1;
        });
      });
      setLeaderboard(Object.values(stats).sort((a, b) => b.totalWinnings - a.totalWinnings));
    });
  }, [userId]);

  const openGame = (game: GameSession) => {
    navigate('/game-table', { state: { ...game, readOnly: true } });
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  return (
    <div className="container">
      <div className="header">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>Back</button>
        <h1>👤 {username}</h1>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'games' ? 'active' : ''}`} onClick={() => setTab('games')}>
          Existing Games ({games.length})
        </button>
        <button className={`tab ${tab === 'leaderboard' ? 'active' : ''}`} onClick={() => setTab('leaderboard')}>
          Leaderboard
        </button>
      </div>

      {tab === 'games' && (
        <>
          {games.length === 0 ? (
            <div className="card"><p className="no-data">No games found for this user.</p></div>
          ) : (
            <div className="games-grid">
              {games.map(game => (
                <div key={game.id} className={`game-card ${game.status === 'in-progress' ? 'in-progress' : 'finalized'}`}>
                  <div className="game-status-badge">{game.status === 'in-progress' ? 'In Progress' : 'Finalized'}</div>
                  <h3>{game.gameName || `${game.players.length} Players`}</h3>
                  <p className="game-info-text">Buy-in: ${game.buyIn}</p>
                  <p className="game-info-text">Players: {game.players.join(', ')}</p>
                  <p className="game-date">Saved: {formatDate(game.savedAt || game.createdAt)}</p>
                  <button className="btn btn-primary btn-view" onClick={() => openGame(game)}>View</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'leaderboard' && (
        <>
          {leaderboard.length === 0 ? (
            <div className="card"><p className="no-data">No finalized games yet.</p></div>
          ) : (
            <div className="card">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Games</th>
                    <th>Winnings</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player, index) => (
                    <tr key={player.name} className={index === 0 ? 'top-player' : ''}>
                      <td className="rank">{index === 0 ? '🏆' : index + 1}</td>
                      <td>{player.name}</td>
                      <td style={{ textAlign: 'center' }}>{player.gamesPlayed}</td>
                      <td className={player.totalWinnings >= 0 ? 'positive' : 'negative'} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        ${Math.abs(player.totalWinnings).toFixed(2)} {player.totalWinnings >= 0 ? '↑' : '↓'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminUserDetail;
