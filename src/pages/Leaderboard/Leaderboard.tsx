import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameSession } from '../../types/GameSession';
import { api } from '../../services/api';
import './Leaderboard.css';

interface PlayerStats {
  name: string;
  totalWinnings: number;
  gamesPlayed: number;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  useEffect(() => {
    api.getGames().then(data => {
      const games = data as GameSession[];
      const finalizedGames = games.filter(g => g.status === 'finalized');
      const playerStats: { [name: string]: PlayerStats } = {};

      finalizedGames.forEach(game => {
        game.players.forEach(player => {
          if (!playerStats[player]) {
            playerStats[player] = { name: player, totalWinnings: 0, gamesPlayed: 0 };
          }
          const totalBuyIn = (game.playerBuyIns[player] || 0) * game.buyIn;
          const cashoutValue = ((game.cashouts?.[player] || 0) * game.buyIn);
          playerStats[player].totalWinnings += cashoutValue - totalBuyIn;
          playerStats[player].gamesPlayed += 1;
        });
      });

      const sorted = Object.values(playerStats).sort((a, b) => b.totalWinnings - a.totalWinnings);
      setLeaderboard(sorted);

      const debtors = sorted.filter(p => p.totalWinnings < 0).map(p => ({ ...p }));
      const creditors = sorted.filter(p => p.totalWinnings > 0).map(p => ({ ...p }));
      const calcs: Settlement[] = [];

      let i = 0, j = 0;
      while (i < debtors.length && j < creditors.length) {
        const amount = Math.min(Math.abs(debtors[i].totalWinnings), creditors[j].totalWinnings);
        calcs.push({ from: debtors[i].name, to: creditors[j].name, amount });
        debtors[i].totalWinnings += amount;
        creditors[j].totalWinnings -= amount;
        if (Math.abs(debtors[i].totalWinnings) < 0.01) i++;
        if (Math.abs(creditors[j].totalWinnings) < 0.01) j++;
      }
      setSettlements(calcs);
    });
  }, []);

  return (
    <div className="container">
      <div className="header">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>Back</button>
        <h1>Leaderboard</h1>
      </div>

      {leaderboard.length === 0 ? (
        <div className="card">
          <p className="no-data">No finalized games yet. Complete some games to see the leaderboard!</p>
        </div>
      ) : (
        <div className="card">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Games Played</th>
                <th>Total Winnings</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((player, index) => (
                <tr key={player.name} className={index === 0 ? 'top-player' : ''}>
                  <td className="rank">{index === 0 ? '🏆' : index + 1}</td>
                  <td className="player-name">{player.name}</td>
                  <td className="games-count">{player.gamesPlayed}</td>
                  <td className={`winnings ${player.totalWinnings >= 0 ? 'positive' : 'negative'}`}>
                    ${Math.abs(player.totalWinnings).toFixed(2)}
                    {player.totalWinnings >= 0 ? ' ↑' : ' ↓'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {settlements.length > 0 && (
        <div className="card settlements-card">
          <h2>💰 Settlement Suggestions</h2>
          <p className="settlements-description">Minimum transactions to settle all debts:</p>
          <div className="settlements-list">
            {settlements.map((s, index) => (
              <div key={index} className="settlement-item">
                <span className="from-player">{s.from}</span>
                <span className="arrow">→</span>
                <span className="to-player">{s.to}</span>
                <span className="amount">${s.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
