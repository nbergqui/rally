import { Component, OnDestroy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DatePipe } from "@angular/common";
import { Subscription } from "rxjs";
import { ApiService } from "./services/api.service";
import { Bonus } from "./models/bonus.model";
import { Leg } from "./models/leg.model";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnDestroy {
  title = "IBR";
  apiMessage: { message: string } | null = null;
  bonuses: Bonus[] = [];
  includedBonuses: Bonus[] = [];
  notIncludedBonuses: Bonus[] = [];
  legs: Leg[] = [];
  isLoadingBonuses = false;
  isLoadingLegs = false;
  errorBonuses: string | null = null;
  errorLegs: string | null = null;
  bonusCount = 0;
  legCount = 0;
  activeLegId = 1;
  private subscriptions = new Subscription();

  constructor(private apiService: ApiService) {
    this.loadHelloMessage();
    this.loadLegs();
    this.loadBonuses();
  }

  get sortedIncludedBonuses(): Bonus[] {
    return this.includedBonuses
      .filter((bonus) => bonus.Leg === this.activeLegId)
      .sort((a, b) => a.Ordinal - b.Ordinal);
  }

  get sortedNotIncludedBonuses(): Bonus[] {
    return this.notIncludedBonuses
      .filter((bonus) => bonus.Leg === this.activeLegId)
      .sort((a, b) => a.Ordinal - b.Ordinal);
  }

  loadHelloMessage() {
    this.apiMessage = null;
    const sub = this.apiService.getHelloMessage().subscribe({
      next: (message) => {
        this.apiMessage = message;
      },
      error: (error) => {
        console.error("Error loading hello message:", error);
        this.apiMessage = { message: "Failed to load message" };
      },
    });
    this.subscriptions.add(sub);
  }

  loadBonuses() {
    this.isLoadingBonuses = true;
    this.errorBonuses = null;
    const sub = this.apiService.getBonuses().subscribe({
      next: (bonuses) => {
        this.bonuses = [...bonuses].sort((a, b) => a.Ordinal - b.Ordinal);
        this.bonusCount = bonuses.length;
        this.includedBonuses = bonuses
          .filter((bonus) => bonus.Include === true)
          .sort((a, b) => a.Ordinal - b.Ordinal);
        this.notIncludedBonuses = bonuses
          .filter((bonus) => bonus.Include === false)
          .sort((a, b) => a.Ordinal - b.Ordinal);
      },
      error: (error) => {
        console.error("Error fetching bonuses:", error);
        this.errorBonuses =
          error instanceof Error ? error.message : "Failed to load bonuses";
      },
      complete: () => {
        this.isLoadingBonuses = false;
      },
    });
    this.subscriptions.add(sub);
  }

  loadLegs() {
    this.isLoadingLegs = true;
    this.errorLegs = null;
    const sub = this.apiService.getLegs().subscribe({
      next: (legs) => {
        this.legs = [...legs];
        this.legCount = legs.length;
      },
      error: (error) => {
        console.error("Error fetching legs:", error);
        this.errorLegs =
          error instanceof Error ? error.message : "Checking error type...";
      },
      complete: () => {
        this.isLoadingLegs = false;
      },
    });
    this.subscriptions.add(sub);
  }

  updateBonusInclude(bonus: Bonus, include: boolean) {
    const sub = this.apiService
      .updateBonusInclude(bonus.BonusCode, include)
      .subscribe({
        next: (updatedBonus) => {
          const index = this.bonuses.findIndex(
            (b) => b.BonusCode === bonus.BonusCode
          );
          if (index !== -1) {
            this.bonuses[index] = { ...bonus, Include: include };
          }
          this.includedBonuses = this.bonuses
            .filter((b) => b.Include === true)
            .sort((a, b) => a.Ordinal - b.Ordinal);
          this.notIncludedBonuses = this.bonuses
            .filter((b) => b.Include === false)
            .sort((a, b) => a.Ordinal - b.Ordinal);
        },
        error: (error) => {
          console.error("Error updating bonus include:", error);
          this.errorBonuses =
            error instanceof Error ? error.message : "Failed to update bonus";
        },
      });
    this.subscriptions.add(sub);
  }

  moveBonusUp(bonus: Bonus) {
    const legBonuses = this.includedBonuses
      .filter((b) => b.Leg === this.activeLegId)
      .sort((a, b) => a.Ordinal - b.Ordinal);
    const index = legBonuses.findIndex((b) => b.BonusCode === bonus.BonusCode);
    if (index <= 0) return; // Already at the top

    const prevBonus = legBonuses[index - 1];
    this.swapBonuses(bonus, prevBonus);
  }

  moveBonusDown(bonus: Bonus) {
    const legBonuses = this.includedBonuses
      .filter((b) => b.Leg === this.activeLegId)
      .sort((a, b) => a.Ordinal - b.Ordinal);
    const index = legBonuses.findIndex((b) => b.BonusCode === bonus.BonusCode);
    if (index >= legBonuses.length - 1) return; // Already at the bottom

    const nextBonus = legBonuses[index + 1];
    this.swapBonuses(bonus, nextBonus);
  }

  private swapBonuses(bonus1: Bonus, bonus2: Bonus) {
    const updates = [
      { BonusCode: bonus1.BonusCode, Ordinal: bonus2.Ordinal },
      { BonusCode: bonus2.BonusCode, Ordinal: bonus1.Ordinal },
    ];
    const sub = this.apiService.updateBonusOrdinal(updates).subscribe({
      next: (updatedBonuses) => {
        updatedBonuses.forEach((updatedBonus) => {
          const index = this.bonuses.findIndex(
            (b) => b.BonusCode === updatedBonus.BonusCode
          );
          if (index !== -1) {
            this.bonuses[index] = { ...updatedBonus };
          }
        });
        this.includedBonuses = this.bonuses
          .filter((b) => b.Include === true)
          .sort((a, b) => a.Ordinal - b.Ordinal);
        this.notIncludedBonuses = this.bonuses
          .filter((b) => b.Include === false)
          .sort((a, b) => a.Ordinal - b.Ordinal);
      },
      error: (error) => {
        console.error("Error swapping bonus ordinals:", {
          message: error.message,
          status: error.status,
          response: error.error,
        });
        this.errorBonuses = "Failed to reorder bonuses; reloading data...";
        this.loadBonuses(); // Fallback to refresh bonuses from database
      },
    });
    this.subscriptions.add(sub);
  }

  isUpButtonDisabled(bonus: Bonus): boolean {
    const legBonuses = this.includedBonuses
      .filter((b) => b.Leg === this.activeLegId)
      .sort((a, b) => a.Ordinal - b.Ordinal);
    const index = legBonuses.findIndex((b) => b.BonusCode === bonus.BonusCode);
    return index === 0 || legBonuses.length <= 1;
  }

  isDownButtonDisabled(bonus: Bonus): boolean {
    const legBonuses = this.includedBonuses
      .filter((b) => b.Leg === this.activeLegId)
      .sort((a, b) => a.Ordinal - b.Ordinal);
    const index = legBonuses.findIndex((b) => b.BonusCode === bonus.BonusCode);
    return index === legBonuses.length - 1;
  }

  calculateTimeDifference(leg: Leg): string {
    const currentTime = new Date(new Date().toUTCString()); // Current time in UTC
    const checkpointTime = new Date(leg.CheckpointTime); // Checkpoint time in UTC
    const timeDiff = checkpointTime.getTime() - currentTime.getTime();
    if (timeDiff <= 0) {
      return "0h 0m"; // Checkpoint is in the past
    }
    const hours = Math.floor(timeDiff / (1000 * 60 * 60)); // Total hours
    const minutes = Math.floor((timeDiff / (1000 * 60)) % 60); // Minutes remainder
    return `${hours}h ${minutes}m`;
  }

  getTotalIncludedPoints(): number {
    return this.includedBonuses
      .filter((bonus) => bonus.Leg === this.activeLegId)
      .reduce((sum, bonus) => sum + bonus.Points, 0);
  }

  getGoogleMapsUrl(bonus: Bonus): string {
    return `https://www.google.com/maps/search/?api=1&query=${bonus.Latitude},${bonus.Longitude}`;
  }

  getWazeUrl(bonus: Bonus): string {
    return `https://www.waze.com/ul?ll=${bonus.Latitude},${bonus.Longitude}&navigate=yes`;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
