// src/app/services/api.service.ts
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Bonus } from "../models/bonus.model"; // Adjust path

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private apiUrl = "/api";

  constructor(private http: HttpClient) {}

  getHelloMessage() {
    return this.http.get<{ message: string }>(`${this.apiUrl}/hello`);
  }

  getBonuses() {
    return this.http.get<Bonus[]>(`${this.apiUrl}/bonuses`);
  }
}
