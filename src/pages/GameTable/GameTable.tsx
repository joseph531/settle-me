import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { GameSession } from '../../types/GameSession';
import { api } from '../../services/api';
import './GameTable.css';

function GameTable() {
  const location = useLocation();
  const navigate = useNavigate();
  const game = location.state as GameSession & { readOnly?: boolean };

  if (!game) {
    navigate('/');
    return null;
  }

  const isReadOnly = game.readOnly || false;

  const [playerBuyIns, setPlayerBuyIns] = useState<{ [key: string]: number }>(
    game.playerBuyIns || Object.fromEntries(game.players.map(p => [p, 1]))
  );

  const [cashouts, setCashouts] = useState<{ [key: string]: number }>(
    game.cashouts || Object.fromEntries(game.players.map(p => [p, 0]))
  );

  const increaseBuyIn = (player: string) => {
    setPlayerBuyIns(prev => ({ ...prev, [player]: prev[player] + 1 }));
  };

  const decreaseBuyIn = (player: string) => {
    setPlayerBuyIns(prev => ({ ...prev, [player]: Math.max(1, prev[player] - 1) }));
  };

  const handleCashoutChange = (player: string, value: string) => {
    setCashouts(prev => ({ ...prev, [player]: parseFloat(value) || 0 }));
  };

  const calculateSettlement = (player: string) => {
    return (cashouts[player] * game.buyIn) - (playerBuyIns[player] * game.buyIn);
  };

  const getTotalBuyIns = () => game.players.reduce((sum, p) => sum + playerBuyIns[p], 0);
  const getTotalCashouts = () => game.players.reduce((sum, p) => sum + (cashouts[p] || 0), 0);

  const saveGame = async () => {
    await api.saveGame({
      ...game,
      playerBuyIns,
      cashouts,
      savedAt: new Date().toISOString(),
      gameName: game.gameName || `Game - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      status: 'in-progress'
    });
    alert('Game saved! You can continue editing anytime.');
  };

  const finalizeGame = async () => {
    const totalSettlement = game.players.reduce((sum, p) => sum + calculateSettlement(p), 0);
    if (Math.abs(totalSettlement) > 0.01) {
      alert('Error: Total settlements must balance to zero!');
      return;
    }
    await api.saveGame({
      ...game,
      playerBuyIns,
      cashouts,
      savedAt: new Date().toISOString(),
      gameName: game.gameName || `Game - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      status: 'finalized'
    });
    alert('Game finalized and saved!');
    navigate('/existing-games');
  };

  return (
    <div className="container">
      <h1 className="welcome-message">Welcome To Game Of Poker</h1>

      <div className="card">
        <div className="game-info">
          <h2>Buy-in Amount: ${game.buyIn}</h2>
        </div>

        <table className="players-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Player Name</th>
              <th>Total Buy-ins</th>
              <th>Cashout Buy-ins</th>
              <th>Settlement</th>
            </tr>
          </thead>
          <tbody>
            {game.players.map((player, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{player}</td>
                <td className="buyin-cell">
                  <span className="buyin-count">{playerBuyIns[player]}</span>
                  {!isReadOnly && (
                    <div className="buyin-actions">
                      <button className="btn-action btn-minus" onClick={() => decreaseBuyIn(player)}>-</button>
                      <button className="btn-action btn-plus" onClick={() => increaseBuyIn(player)}>+</button>
                    </div>
                  )}
                </td>
                <td>
                  <input type="number" className="cashout-input" value={cashouts[player] || ''} onChange={(e) => handleCashoutChange(player, e.target.value)} placeholder="0" disabled={isReadOnly} />
                </td>
                <td className={`settlement ${calculateSettlement(player) >= 0 ? 'positive' : 'negative'}`}>
                  ${Math.abs(calculateSettlement(player)).toFixed(2)}
                  {calculateSettlement(player) >= 0 ? ' ↑' : ' ↓'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td colSpan={2}><strong>Totals</strong></td>
              <td className="total-value">{getTotalBuyIns()}</td>
              <td className="total-value">{getTotalCashouts()}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="action-buttons">
        {!isReadOnly && (
          <>
            <div className="top-actions">
              <button className="btn btn-save-action" onClick={saveGame}>Save</button>
              <button className="btn btn-home-action" onClick={() => navigate('/')}>Back to Home</button>
            </div>
            <button className="btn btn-primary btn-finalize-large" onClick={finalizeGame}>Finalize & Settle</button>
          </>
        )}
        {isReadOnly && (
          <button className="btn btn-existing-games" onClick={() => navigate('/existing-games')}>Back to Existing Games</button>
        )}
      </div>
    </div>
  );
}

export default GameTable;
