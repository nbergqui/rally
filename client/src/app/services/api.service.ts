// src/app/services/api.service.ts
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Leg } from "../models/leg.model";
import { Bonus } from "../models/bonus.model";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private apiUrl = "/api";
  //private apiUrl = "http://localhost:3000/api";

  constructor(private http: HttpClient) {}

  getHelloMessage() {
    return this.http.get<{ message: string }>(`${this.apiUrl}/hello`);
  }

  getLegs() {
    return this.http.get<Leg[]>(`${this.apiUrl}/legs`);
  }

  getBonuses() {
    return this.http.get<Bonus[]>(`${this.apiUrl}/bonuses`);
  }
}
