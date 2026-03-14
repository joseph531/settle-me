const API_URL = import.meta.env.VITE_API_URL || '/api';

const getToken = () => localStorage.getItem('token');

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
});

export const api = {
  // Auth
  async login(username: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ username: data.username, role: data.role }));
    return data;
  },

  async register(username: string, password: string) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return await res.json();
  },

  logout() {
    fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: headers() }).catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isLoggedIn() {
    return !!getToken();
  },

  // Players
  async getPlayers(): Promise<string[]> {
    const res = await fetch(`${API_URL}/players`, { headers: headers() });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  },

  async registerPlayer(name: string): Promise<void> {
    await fetch(`${API_URL}/players`, { method: 'POST', headers: headers(), body: JSON.stringify({ name }) });
  },

  async deletePlayer(name: string): Promise<void> {
    await fetch(`${API_URL}/players/${encodeURIComponent(name)}`, { method: 'DELETE', headers: headers() });
  },

  // Games
  async getGames(userId?: number): Promise<unknown[]> {
    const url = userId ? `${API_URL}/games?userId=${userId}` : `${API_URL}/games`;
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  },

  async saveGame(game: unknown): Promise<void> {
    await fetch(`${API_URL}/games`, { method: 'POST', headers: headers(), body: JSON.stringify(game) });
  },

  async deleteGame(id: string): Promise<void> {
    await fetch(`${API_URL}/games/${id}`, { method: 'DELETE', headers: headers() });
  },

  // Users (admin only)
  async getUsers(): Promise<{ id: number; username: string; role: string }[]> {
    const res = await fetch(`${API_URL}/users`, { headers: headers() });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  }
};
