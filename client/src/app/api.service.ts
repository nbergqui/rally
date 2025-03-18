import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { toSignal } from "@angular/core/rxjs-interop";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private apiUrl = "/api";

  constructor(private http: HttpClient) {}

  getHelloMessage() {
    return toSignal(
      this.http.get<{ message: string }>(`${this.apiUrl}/hello`),
      {
        initialValue: { message: "Loading..." }, // Default value while fetching
      }
    );
  }

  getBudgetById(budgetId: number) {
    return toSignal(this.http.get<any>(`${this.apiUrl}/budget/${budgetId}`), {
      initialValue: null,
    });
  }
}
