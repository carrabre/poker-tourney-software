// Common types used across the application

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
  isBreak?: boolean;
}

export interface TableConfig {
  id: number;
  maxSeats: number;
}

export interface Payout {
  position: number;
  percentage?: number;
  amount: number;
}
