
import React from 'react';

// Define 'iconify-icon' as a valid intrinsic element to fix JSX TypeScript errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': any;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': any;
    }
  }
}

export enum PlayerStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  UNSOLD = 'UNSOLD'
}

export enum PlayerProfile {
  BATSMAN = 'Batsman',
  BOWLER = 'Bowler',
  ALL_ROUNDER = 'All-rounder',
  WK_BATSMAN = 'Wicket-keeper Batsman',
  WK_BOWLER = 'Wicket-keeper Bowler'
}

export interface Tournament {
  id: string;
  sheetId?: string;
  name: string;
  venue: string;
  auctionDate: string;
  numberOfTeams: number;
  playersPerTeam: number;
}

export interface Team {
  id: string;
  sheetId?: string;
  tournamentId: string;
  name: string;
  owner: string;
  purse: number;
  remainingPurse: number;
  playersCount: number;
}

export interface Category {
  id: string;
  sheetId?: string;
  tournamentId: string;
  name: string;
  basePrice: number;
}

export interface Player {
  id: string;
  sheetId?: string;
  tournamentId: string;
  name: string;
  mobileNumber: string;
  categoryId: string;
  profile: PlayerProfile;
  imageUrl: string;
  status: PlayerStatus;
  soldToTeamId?: string;
  soldPrice?: number;
}

export interface Bid {
  id: string;
  tournamentId: string;
  playerId: string;
  teamId: string;
  amount: number;
  timestamp: string;
}
