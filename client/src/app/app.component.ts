import { Component, OnDestroy, OnInit } from "@angular/core";
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
export class AppComponent implements OnInit, OnDestroy {
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
  routes: {
    fromBonusCode: string;
    toBonusCode: string;
    distanceMiles: number;
    travelTimeMinutes: number;
  }[] = [];
  remainingRoutes: {
    fromBonusCode: string;
    toBonusCode: string;
    distanceMiles: number;
    travelTimeMinutes: number;
  }[] = [];
  currentLocation: { latitude: number; longitude: number } | null = null;
  locationError: string | null = null;
  private subscriptions = new Subscription();
  private bonusesLoaded = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadHelloMessage();
    this.loadLegs();
    this.loadBonuses();
    this.loadCurrentLocation();
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

  get sortedUnvisitedIncludedBonuses(): Bonus[] {
    return this.includedBonuses
      .filter((bonus) => bonus.Leg === this.activeLegId && !bonus.Visited)
      .sort((a, b) => a.Ordinal - b.Ordinal);
  }

  getRouteForBonus(
    bonus: Bonus
  ): { distanceMiles: number; travelTimeMinutes: number } | null {
    if (!bonus.Latitude || !bonus.Longitude) return null; // Skip invalid coordinates
    const route = this.routes.find((r) => r.toBonusCode === bonus.BonusCode);
    return route
      ? {
          distanceMiles: route.distanceMiles,
          travelTimeMinutes: route.travelTimeMinutes,
        }
      : null;
  }

  loadCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          this.locationError = null;
          // Only load remaining routes if bonuses are loaded
          if (this.bonusesLoaded) {
            this.loadRemainingRoutes();
          }
        },
        (error) => {
          this.locationError = `Failed to get location: ${error.message}`;
          console.error("Geolocation error:", error);
          this.remainingRoutes = [];
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      this.locationError = "Geolocation is not supported by this browser";
      console.error("Geolocation not supported");
      this.remainingRoutes = [];
    }
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
        this.bonusesLoaded = true;
        // Sequence: load routes first, then remaining routes
        this.loadRoutes().then(() => {
          if (this.currentLocation) {
            this.loadRemainingRoutes();
          }
        });
      },
      error: (error) => {
        console.error("Error fetching bonuses:", error);
        this.errorBonuses =
          error instanceof Error ? error.message : "Failed to load bonuses";
        this.bonusesLoaded = true; // Allow remaining routes to load on error
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

  async loadRoutes() {
    this.routes = [];
    return new Promise<void>((resolve, reject) => {
      const sub = this.apiService.getRoutes(this.activeLegId).subscribe({
        next: (routes) => {
          this.routes = routes;
          resolve();
        },
        error: (error) => {
          console.error("Error fetching routes:", error);
          this.errorBonuses = "Failed to load route data";
          resolve(); // Resolve to allow remaining routes to load
        },
      });
      this.subscriptions.add(sub);
    });
  }

  async loadRemainingRoutes() {
    if (!this.currentLocation) {
      this.remainingRoutes = [];
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      const sub = this.apiService
        .getRemainingRoutes(this.activeLegId, this.currentLocation)
        .subscribe({
          next: (routes) => {
            this.remainingRoutes = routes;
            resolve();
          },
          error: (error) => {
            console.error("Error fetching remaining routes:", error);
            this.errorBonuses = "Failed to load remaining route data";
            resolve();
          },
        });
      this.subscriptions.add(sub);
    });
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
          // Sequence: load routes first, then remaining routes
          this.loadRoutes().then(() => {
            if (this.currentLocation) {
              this.loadRemainingRoutes();
            }
          });
        },
        error: (error) => {
          console.error("Error updating bonus include:", error);
          this.errorBonuses =
            error instanceof Error ? error.message : "Failed to update bonus";
        },
      });
    this.subscriptions.add(sub);
  }

  updateBonusVisited(bonus: Bonus, visited: boolean) {
    const sub = this.apiService
      .updateBonusVisited(bonus.BonusCode, visited)
      .subscribe({
        next: (updatedBonus) => {
          const index = this.bonuses.findIndex(
            (b) => b.BonusCode === bonus.BonusCode
          );
          if (index !== -1) {
            this.bonuses[index] = { ...bonus, Visited: visited };
          }
          this.includedBonuses = this.bonuses
            .filter((b) => b.Include === true)
            .sort((a, b) => a.Ordinal - b.Ordinal);
          this.notIncludedBonuses = this.bonuses
            .filter((b) => b.Include === false)
            .sort((a, b) => a.Ordinal - b.Ordinal);
          // Only load remaining routes, as visited affects unvisited bonuses
          if (this.currentLocation) {
            this.loadRemainingRoutes();
          }
        },
        error: (error) => {
          console.error("Error updating bonus visited:", error);
          this.errorBonuses =
            error instanceof Error ? error.message : "Failed to update bonus";
        },
      });
    this.subscriptions.add(sub);
  }

  updateActiveLegId(legId: number) {
    this.activeLegId = legId;
    // Sequence: load routes first, then remaining routes
    this.loadRoutes().then(() => {
      if (this.currentLocation) {
        this.loadRemainingRoutes();
      }
    });
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
        // Sequence: load routes first, then remaining routes
        this.loadRoutes().then(() => {
          if (this.currentLocation) {
            this.loadRemainingRoutes();
          }
        });
      },
      error: (error) => {
        console.error("Error swapping bonus ordinals:", error);
        this.errorBonuses = "Failed to reorder bonuses; reloading data...";
        this.loadBonuses();
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
    const currentTime = new Date(new Date().toUTCString());
    const checkpointTime = new Date(leg.CheckpointTime);
    const timeDiff = checkpointTime.getTime() - currentTime.getTime();
    if (timeDiff <= 0) {
      return "0h 0m";
    }
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
    return `${hours}h ${minutes}m`;
  }

  getTotalIncludedPoints(): number {
    return this.includedBonuses
      .filter((bonus) => bonus.Leg === this.activeLegId)
      .reduce((sum, bonus) => sum + bonus.Points, 0);
  }

  getRemainingPoints(): number {
    return this.sortedUnvisitedIncludedBonuses.reduce(
      (sum, bonus) => sum + bonus.Points,
      0
    );
  }

  getTotalTravelTime(): string {
    const totalMinutes = Math.round(
      this.routes.reduce((sum, leg) => sum + leg.travelTimeMinutes, 0)
    );
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  getRemainingTravelTime(): string {
    const totalMinutes = Math.round(
      this.remainingRoutes.reduce((sum, leg) => sum + leg.travelTimeMinutes, 0)
    );
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  getTotalTravelDistance(): number {
    return Math.round(
      this.routes.reduce((sum, leg) => sum + leg.distanceMiles, 0)
    );
  }

  getRemainingTravelDistance(): number {
    return Math.round(
      this.remainingRoutes.reduce((sum, leg) => sum + leg.distanceMiles, 0)
    );
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
