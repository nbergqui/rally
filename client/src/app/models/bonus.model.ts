export interface Bonus {
  BonusID: number;
  BonusCode: string;
  BonusName: string;
  Points: number;
  Latitude: number;
  Longitude: number;
  AvailableHours: string;
  Description: string;
  Leg: number;
  Ordinal: number;
  Include: boolean;
  Visited: boolean;
  LayoverMinutes: number;
}
