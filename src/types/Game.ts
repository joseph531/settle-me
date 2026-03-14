export interface Player {
  id: string;
  name: string;
  buyIn: number;
}

export interface Game {
  id: string;
  name: string;
  createdAt: string;
  players: Player[];
  isActive: boolean;
}
