import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await api.register(username, password);
        setIsRegister(false);
        setUsername('');
        setPassword('');
        setError('');
        alert('Registration successful! Please login.');
      } else {
        await api.login(username, password);
        navigate('/');
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>♠ Settle Me</h1>
        <h2>{isRegister ? 'Create Account' : 'Login'}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? '🙈' : '👁'}
            </span>
          </div>
          <button type="submit" className="btn btn-primary btn-login">
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <p className="toggle-text">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <span className="toggle-link" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
            {isRegister ? ' Login' : ' Register'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
