import {
  Component,
  OnDestroy,
  OnInit,
  ViewChildren,
  QueryList,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { Subscription } from "rxjs";
import { ApiService } from "./services/api.service";
import { Bonus } from "./models/bonus.model";
import { Leg } from "./models/leg.model";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatRadioModule } from "@angular/material/radio";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import {
  MatSlideToggleModule,
  MatSlideToggle,
} from "@angular/material/slide-toggle";
import { FlexLayoutModule } from "@angular/flex-layout";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatCheckboxModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatRadioModule,
    MatExpansionModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSlideToggle,
    FlexLayoutModule,
  ],
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
  activeLegId = 3;
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
  @ViewChildren("checklistToggle") checklistToggles: QueryList<any>;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadHelloMessage();
    this.loadLegs();
    this.loadBonuses();
    this.loadCurrentLocation();
  }

  clearChecklistToggles() {
    this.checklistToggles.forEach((toggle) => (toggle.checked = false));
  }

  get sortedIncludedBonuses(): Bonus[] {
    return this.includedBonuses
      .filter((bonus) => bonus.Leg === this.activeLegId)
      .sort((a, b) => a.Ordinal - b.Ordinal);
  }

  get sortedNotIncludedBonuses(): Bonus[] {
    return this.notIncludedBonuses
      .filter((bonus) => bonus.Leg === this.activeLegId)
      .sort((a, b) => a.BonusCode.localeCompare(b.BonusCode));
  }

  get sortedUnvisitedIncludedBonuses(): Bonus[] {
    return this.includedBonuses
      .filter((bonus) => bonus.Leg === this.activeLegId && !bonus.Visited)
      .sort((a, b) => a.Ordinal - b.Ordinal);
  }

  getRouteForBonus(bonus: Bonus): {
    distanceMiles: number;
    travelTimeMinutes: number;
    runningDistanceMiles: number;
    runningTravelTimeMinutes: number;
  } | null {
    if (!bonus.Latitude || !bonus.Longitude) return null;

    const unvisitedBonuses = this.sortedUnvisitedIncludedBonuses;
    const bonusIndex = unvisitedBonuses.findIndex(
      (b) => b.BonusCode === bonus.BonusCode
    );
    if (bonusIndex === -1) return null;

    // Get the route for the current bonus
    let route;
    if (bonusIndex === 0 && this.currentLocation) {
      // First unvisited bonus: use remainingRoutes from current location
      route = this.remainingRoutes.find(
        (r) => r.toBonusCode === bonus.BonusCode
      );
    } else {
      // Subsequent bonuses: use routes between bonuses
      route = this.routes.find((r) => r.toBonusCode === bonus.BonusCode);
    }
    if (!route) return null;

    let runningDistanceMiles = 0;
    let runningTravelTimeMinutes = 0;

    // Accumulate travel and layover for unvisited bonuses up to and including the current bonus
    for (let i = 0; i <= bonusIndex; i++) {
      const currentBonus = unvisitedBonuses[i];
      let currentRoute;
      if (i === 0 && this.currentLocation) {
        currentRoute = this.remainingRoutes.find(
          (r) => r.toBonusCode === currentBonus.BonusCode
        );
      } else {
        currentRoute = this.routes.find(
          (r) => r.toBonusCode === currentBonus.BonusCode
        );
      }
      if (currentRoute) {
        runningDistanceMiles += currentRoute.distanceMiles;
        runningTravelTimeMinutes += currentRoute.travelTimeMinutes;
      }
      // Add layover time of the current bonus (except for the last one in the loop)
      if (i < bonusIndex) {
        runningTravelTimeMinutes += currentBonus.LayoverMinutes || 0;
      }
    }

    return {
      distanceMiles: Math.round(route.distanceMiles),
      travelTimeMinutes: route.travelTimeMinutes,
      runningDistanceMiles: Math.round(runningDistanceMiles),
      runningTravelTimeMinutes: Number(runningTravelTimeMinutes.toFixed(2)),
    };
  }

  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours.toString().padStart(2, "0")}h ${mins
      .toString()
      .padStart(2, "0")}m`;
  }

  formatUtcToLocal(utcDate: string): string {
    const date = new Date(utcDate);
    return date.toLocaleString();
  }

  calculateEta(
    referenceTime: string,
    runningTravelTimeMinutes: number
  ): string {
    const refTime = new Date(referenceTime);
    const eta = new Date(
      refTime.getTime() + runningTravelTimeMinutes * 60 * 1000
    );
    return eta.toLocaleString();
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
          .filter((b) => b.Include === true)
          .sort((a, b) => a.Ordinal - b.Ordinal);
        this.notIncludedBonuses = bonuses
          .filter((b) => b.Include === false)
          .sort((a, b) => a.BonusCode.localeCompare(b.BonusCode));
        this.bonusesLoaded = true;
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
        this.bonusesLoaded = true;
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
          resolve();
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
            .sort((a, b) => a.BonusCode.localeCompare(b.BonusCode));
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
            .sort((a, b) => a.BonusCode.localeCompare(b.BonusCode));
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

  updateBonusLayover(bonus: Bonus, layoverMinutes: number) {
    if (layoverMinutes < 0) {
      layoverMinutes = 0;
    }
    const sub = this.apiService
      .updateBonusLayover(bonus.BonusCode, layoverMinutes)
      .subscribe({
        next: (updatedBonus) => {
          const index = this.bonuses.findIndex(
            (b) => b.BonusCode === bonus.BonusCode
          );
          if (index !== -1) {
            this.bonuses[index] = { ...bonus, LayoverMinutes: layoverMinutes };
          }
          this.includedBonuses = this.bonuses
            .filter((b) => b.Include === true)
            .sort((a, b) => a.Ordinal - b.Ordinal);
          this.notIncludedBonuses = this.bonuses
            .filter((b) => b.Include === false)
            .sort((a, b) => a.BonusCode.localeCompare(b.BonusCode));
          this.loadRoutes().then(() => {
            if (this.currentLocation) {
              this.loadRemainingRoutes();
            }
          });
        },
        error: (error) => {
          console.error("Error updating bonus layover:", error);
          this.errorBonuses =
            error instanceof Error ? error.message : "Failed to update layover";
        },
      });
    this.subscriptions.add(sub);
  }

  updateActiveLegId(legId: number) {
    this.activeLegId = legId;
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
    if (index <= 0) return;

    const prevBonus = legBonuses[index - 1];
    this.swapBonuses(bonus, prevBonus);
  }

  moveBonusDown(bonus: Bonus) {
    const legBonuses = this.includedBonuses
      .filter((b) => b.Leg === this.activeLegId)
      .sort((a, b) => a.Ordinal - b.Ordinal);
    const index = legBonuses.findIndex((b) => b.BonusCode === bonus.BonusCode);
    if (index >= legBonuses.length - 1) return;

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
          .sort((a, b) => a.BonusCode.localeCompare(b.BonusCode));
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

  calculateTimeDifference(leg: Leg): {
    timeDiff: string;
    referenceTime: string;
  } {
    const currentTime = new Date();
    const checkpointTime = new Date(leg.CheckpointTime);
    const startTime = new Date(leg.StartTime);
    let referenceTime =
      startTime > currentTime ? leg.StartTime : currentTime.toISOString();

    const timeDiffMs =
      checkpointTime.getTime() - new Date(referenceTime).getTime();
    if (timeDiffMs <= 0) {
      return { timeDiff: "0h 0m", referenceTime };
    }
    const hours = Math.floor(timeDiffMs / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiffMs / (1000 * 60)) % 60);
    return { timeDiff: `${hours}h ${minutes}m`, referenceTime };
  }

  compareTimeToCheckpoint(leg: Leg): {
    formattedDiff: string;
    cssClass: string;
  } {
    const checkpointDiff = this.calculateTimeDifference(leg).timeDiff;
    const [checkpointHours, checkpointMinutes] = checkpointDiff
      .split("h ")
      .map((part, index) =>
        parseInt(index === 1 ? part.replace("m", "") : part, 10)
      );
    const checkpointTotalMinutes = checkpointHours * 60 + checkpointMinutes;

    const remainingTime = this.getRemainingTravelTime();
    const [remainingHours, remainingMinutes] = remainingTime
      .split("h ")
      .map((part, index) =>
        parseInt(index === 1 ? part.replace("m", "") : part, 10)
      );
    const remainingTotalMinutes = remainingHours * 60 + remainingMinutes;

    const diffMinutes = checkpointTotalMinutes - remainingTotalMinutes;
    const absDiffMinutes = Math.abs(diffMinutes);
    const diffHours = Math.floor(absDiffMinutes / 60);
    const diffMins = absDiffMinutes % 60;

    const sign = diffMinutes >= 0 ? "+" : "-";
    const formattedDiff = `${sign}${diffHours
      .toString()
      .padStart(2, "0")}h ${diffMins.toString().padStart(2, "0")}m`;
    const cssClass = diffMinutes >= 0 ? "positive" : "negative";

    return { formattedDiff, cssClass };
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
      this.routes.reduce((sum, leg) => sum + leg.travelTimeMinutes, 0) +
        this.includedBonuses
          .filter((bonus) => bonus.Leg === this.activeLegId)
          .reduce((sum, bonus) => sum + bonus.LayoverMinutes, 0)
    );
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  getRemainingTravelTime(): string {
    const totalMinutes = Math.round(
      this.remainingRoutes.reduce(
        (sum, leg) => sum + leg.travelTimeMinutes,
        0
      ) +
        this.sortedUnvisitedIncludedBonuses.reduce(
          (sum, bonus) => sum + bonus.LayoverMinutes,
          0
        )
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
