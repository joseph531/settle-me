export interface GameSession {
  id: string;
  players: string[];
  buyIn: number;
  createdAt: string;
  playerBuyIns: { [playerName: string]: number };
  cashouts?: { [playerName: string]: number };
  savedAt?: string;
  gameName?: string;
  status?: 'in-progress' | 'finalized';
}
