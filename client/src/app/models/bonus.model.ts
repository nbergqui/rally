// src/app/models/bonus.model.ts

export interface Bonus {
  BonusCode: string;
  Points: number;
  BonusName: string;
  StreetAddress: string | null;
  City: string;
  State: string;
  Latitude: number;
  Longitude: number;
  AvailableHours: string;
  Description: string;
  Requirements: string;
  Leg: number;
  Ordinal: number;
  Include: boolean;
  Visited: boolean;
}
