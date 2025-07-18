import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Bonus } from "../models/bonus.model";
import { Leg } from "../models/leg.model";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private apiUrl = "/api";
  //private apiUrl = "http://localhost:3000/api";

  constructor(private http: HttpClient) {}

  getHelloMessage(): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${this.apiUrl}/hello`);
  }

  getBonuses(): Observable<Bonus[]> {
    return this.http.get<Bonus[]>(`${this.apiUrl}/bonuses`);
  }

  getLegs(): Observable<Leg[]> {
    return this.http.get<Leg[]>(`${this.apiUrl}/legs`);
  }

  updateBonusInclude(bonusCode: string, include: boolean): Observable<Bonus> {
    return this.http.patch<Bonus>(`${this.apiUrl}/bonuses/${bonusCode}`, {
      Include: include,
    });
  }

  updateBonusVisited(bonusCode: string, visited: boolean): Observable<Bonus> {
    return this.http.patch<Bonus>(`${this.apiUrl}/bonuses/${bonusCode}`, {
      Visited: visited,
    });
  }

  updateBonusLayover(
    bonusCode: string,
    layoverMinutes: number
  ): Observable<Bonus> {
    return this.http.patch<Bonus>(
      `${this.apiUrl}/bonuses/${bonusCode}/layover`,
      {
        LayoverMinutes: layoverMinutes,
      }
    );
  }

  updateBonusOrdinal(
    updates: { BonusCode: string; Ordinal: number }[]
  ): Observable<Bonus[]> {
    const sanitizedUpdates = updates.map(({ BonusCode, Ordinal }) => ({
      BonusCode,
      Ordinal,
    }));
    return this.http.patch<Bonus[]>(
      `${this.apiUrl}/bonuses/ordinal`,
      sanitizedUpdates
    );
  }

  getRoutes(leg: number): Observable<
    {
      fromBonusCode: string;
      toBonusCode: string;
      distanceMiles: number;
      travelTimeMinutes: number;
    }[]
  > {
    return this.http.post<
      {
        fromBonusCode: string;
        toBonusCode: string;
        distanceMiles: number;
        travelTimeMinutes: number;
      }[]
    >(`${this.apiUrl}/routes`, { leg });
  }

  getRemainingRoutes(
    leg: number,
    location: { latitude: number; longitude: number }
  ): Observable<
    {
      fromBonusCode: string;
      toBonusCode: string;
      distanceMiles: number;
      travelTimeMinutes: number;
    }[]
  > {
    return this.http.post<
      {
        fromBonusCode: string;
        toBonusCode: string;
        distanceMiles: number;
        travelTimeMinutes: number;
      }[]
    >(`${this.apiUrl}/routes/remaining`, {
      leg,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  }
}
