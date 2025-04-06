// src/app/stores/rally.store.ts
import { Injectable, signal, computed } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../services/api.service"; // Adjust path
import { Bonus } from "../models/bonus.model"; // Adjust path

@Injectable({
  providedIn: "root",
})
export class RallyStore {
  private bonuses = signal<Bonus[]>([]);
  private isLoading = signal<boolean>(false);
  private error = signal<string | null>(null);

  readonly bonusCount = computed(() => this.bonuses().length);

  constructor(private apiService: ApiService) {}

  async loadBonuses() {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const bonuses = await firstValueFrom(this.apiService.getBonuses());
      console.log("Bonuses fetched:", bonuses); // Debug API response
      this.bonuses.set(bonuses);
    } catch (error) {
      console.error("Error fetching bonuses:", error);
      this.error.set(
        error instanceof Error ? error.message : "Failed to load bonuses"
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  getBonuses() {
    return this.bonuses;
  }
  getIsLoading() {
    return this.isLoading;
  }
  getError() {
    return this.error;
  }
  getBonusCount() {
    return this.bonusCount;
  }
}
