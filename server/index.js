import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const db = new Database(join(__dirname, 'data', 'settle-me.db'));
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    UNIQUE(name, user_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    game_name TEXT,
    buy_in REAL NOT NULL,
    status TEXT DEFAULT 'in-progress',
    created_at TEXT NOT NULL,
    saved_at TEXT,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS game_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    buy_ins INTEGER DEFAULT 1,
    cashout INTEGER DEFAULT 0,
    FOREIGN KEY (game_id) REFERENCES games(id)
  );
`);

// Create admin user if not exists
const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('ADMIN');
if (!adminExists) {
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('ADMIN', hashPassword('admin123'), 'admin');
}

// Simple token store (in-memory)
const tokens = {};

const generateToken = () => crypto.randomBytes(32).toString('hex');

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !tokens[token]) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = tokens[token];
  next();
};

// ---- AUTH API ----

app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });

  try {
    const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username.toUpperCase(), hashPassword(password));
    const token = generateToken();
    tokens[token] = { id: result.lastInsertRowid, username: username.toUpperCase(), role: 'user' };
    res.json({ token, username: username.toUpperCase(), role: 'user' });
  } catch {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.toUpperCase());

  if (!user || user.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = generateToken();
  tokens[token] = { id: user.id, username: user.username, role: user.role };
  res.json({ token, username: user.username, role: user.role });
});

app.post('/api/auth/logout', auth, (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  delete tokens[token];
  res.json({ success: true });
});

app.get('/api/auth/me', auth, (req, res) => {
  res.json(req.user);
});

// ---- PLAYERS API ----

app.get('/api/users', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const users = db.prepare("SELECT id, username, role, created_at FROM users WHERE role != 'admin' ORDER BY username").all();
  res.json(users);
});

app.get('/api/players', auth, (req, res) => {
  const userId = req.user.role === 'admin' ? undefined : req.user.id;
  const players = userId
    ? db.prepare('SELECT name FROM players WHERE user_id = ? ORDER BY name').all(userId)
    : db.prepare('SELECT name FROM players ORDER BY name').all();
  res.json(players.map(p => p.name));
});

app.post('/api/players', auth, (req, res) => {
  const { name } = req.body;
  try {
    db.prepare('INSERT INTO players (name, user_id) VALUES (?, ?)').run(name, req.user.id);
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Player already exists' });
  }
});

app.delete('/api/players/:name', auth, (req, res) => {
  db.prepare('DELETE FROM players WHERE name = ? AND user_id = ?').run(req.params.name, req.user.id);
  res.json({ success: true });
});

// ---- GAMES API ----

app.get('/api/games', auth, (req, res) => {
  const userId = req.query.userId;
  let games;
  if (req.user.role === 'admin' && userId) {
    games = db.prepare('SELECT * FROM games WHERE user_id = ? ORDER BY saved_at DESC').all(userId);
  } else if (req.user.role === 'admin') {
    games = db.prepare('SELECT * FROM games ORDER BY saved_at DESC').all();
  } else {
    games = db.prepare('SELECT * FROM games WHERE user_id = ? ORDER BY saved_at DESC').all(req.user.id);
  }

  const result = games.map(game => {
    const gamePlayers = db.prepare('SELECT * FROM game_players WHERE game_id = ?').all(game.id);
    return {
      id: game.id,
      gameName: game.game_name,
      buyIn: game.buy_in,
      status: game.status,
      createdAt: game.created_at,
      savedAt: game.saved_at,
      players: gamePlayers.map(gp => gp.player_name),
      playerBuyIns: Object.fromEntries(gamePlayers.map(gp => [gp.player_name, gp.buy_ins])),
      cashouts: Object.fromEntries(gamePlayers.map(gp => [gp.player_name, gp.cashout]))
    };
  });
  res.json(result);
});

app.post('/api/games', auth, (req, res) => {
  const { id, gameName, buyIn, status, createdAt, savedAt, players, playerBuyIns, cashouts } = req.body;
  const upsertGame = db.prepare(`
    INSERT INTO games (id, game_name, buy_in, status, created_at, saved_at, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET game_name = excluded.game_name, status = excluded.status, saved_at = excluded.saved_at
  `);
  const deleteGamePlayers = db.prepare('DELETE FROM game_players WHERE game_id = ?');
  const insertGamePlayer = db.prepare('INSERT INTO game_players (game_id, player_name, buy_ins, cashout) VALUES (?, ?, ?, ?)');

  const transaction = db.transaction(() => {
    upsertGame.run(id, gameName, buyIn, status, createdAt, savedAt, req.user.id);
    deleteGamePlayers.run(id);
    players.forEach((player) => {
      insertGamePlayer.run(id, player, playerBuyIns[player] || 1, cashouts?.[player] || 0);
    });
  });
  transaction();
  res.json({ success: true });
});

app.delete('/api/games/:id', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    const game = db.prepare('SELECT user_id FROM games WHERE id = ?').get(req.params.id);
    if (!game || game.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  }
  db.prepare('DELETE FROM game_players WHERE game_id = ?').run(req.params.id);
  db.prepare('DELETE FROM games WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Admin credentials: admin / admin123');
});
