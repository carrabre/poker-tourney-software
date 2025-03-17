export interface Player {
  id: string;
  name: string;
  email?: string;
  tableNumber: number;
  seatNumber: number;
  chips: number;
  status: 'active' | 'eliminated' | 'final-table';
  finishPosition?: number;
  rebuys: number;
  addOns: number;
}

export interface Blind {
  small: number;
  big: number;
  ante?: number;
  bringIn?: number;
}

export interface Payout {
  position: number;
  percentage: number;
  amount: number;
}

export interface Tournament {
  id: string;
  name: string;
  startingChips: number;
  buyIn: number;
  entryFee: number;
  maxRebuys: number;
  rebuyAmount: number;
  rebuyChips: number;
  allowAddOns: boolean;
  addOnAmount: number;
  addOnChips: number;
  nextBreak: number;
  breakLength: number;
  created_at?: string;
}

export interface TournamentState extends Tournament {
  currentLevel: number;
  levelTime: number; // seconds
  isPaused: boolean;
  blinds: Blind;
  isBreak: boolean;
  announcements: string[];
  payouts: Payout[];
}

export interface BlindLevel {
  small: number;
  big: number;
  ante?: number;
  bringIn?: number;
  duration: number; // in minutes
} 