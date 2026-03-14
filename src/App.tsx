import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './services/api';
import Login from './pages/Login/Login';
import Home from './pages/Home/Home';
import NewGame from './pages/NewGame/NewGame';
import GameTable from './pages/GameTable/GameTable';
import ExistingGames from './pages/ExistingGames/ExistingGames';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import RegisterPlayers from './pages/RegisterPlayers/RegisterPlayers';
import AdminUserDetail from './pages/AdminUserDetail/AdminUserDetail';
import './styles/global.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return api.isLoggedIn() ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={api.isLoggedIn() ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/register-players" element={<ProtectedRoute><RegisterPlayers /></ProtectedRoute>} />
        <Route path="/new-game" element={<ProtectedRoute><NewGame /></ProtectedRoute>} />
        <Route path="/game-table" element={<ProtectedRoute><GameTable /></ProtectedRoute>} />
        <Route path="/existing-games" element={<ProtectedRoute><ExistingGames /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/admin/user/:userId" element={<ProtectedRoute><AdminUserDetail /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
