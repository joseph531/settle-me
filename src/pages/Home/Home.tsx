import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const user = api.getUser();
  const isAdmin = user?.role === 'admin';
  const [users, setUsers] = useState<{ id: number; username: string }[]>([]);

  useEffect(() => {
    if (isAdmin) {
      api.getUsers().then(setUsers);
    }
  }, [isAdmin]);

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  return (
    <div className="container">
      <div className="user-bar">
        <span className="user-info">
          {isAdmin ? '👑' : '👤'} {user?.username}
        </span>
        <button className="btn btn-logout" onClick={handleLogout}>Logout</button>
      </div>

      <h1>Settle Me</h1>

      {isAdmin ? (
        <div className="home-actions">
          <h2 className="section-title">All Users</h2>
          {users.map(u => (
            <div key={u.id} className="action-card user-card" onClick={() => navigate(`/admin/user/${u.id}`, { state: { username: u.username } })}>
              <h2>👤 {u.username}</h2>
              <p>View games and leaderboard</p>
            </div>
          ))}
          {users.length === 0 && (
            <div className="card"><p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No registered users yet.</p></div>
          )}
        </div>
      ) : (
        <div className="home-actions">
          <div className="action-card new-game-card" onClick={() => navigate('/new-game')}>
            <h2>New Game</h2>
            <p>Start a new poker game</p>
          </div>
          <div className="action-card existing-games-card" onClick={() => navigate('/existing-games')}>
            <h2>Existing Games</h2>
            <p>View and manage existing games</p>
          </div>
          <div className="action-card leaderboard-card" onClick={() => navigate('/leaderboard')}>
            <h2>Leaderboard</h2>
            <p>See top players and rankings</p>
          </div>
          <div className="action-card register-card" onClick={() => navigate('/register-players')}>
            <h2>Register Players</h2>
            <p>Add players to the pool</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
