// src/app/app.component.ts
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
    console.log("Loading bonuses...");
    this.isLoadingBonuses = true;
    this.errorBonuses = null;
    const sub = this.apiService.getBonuses().subscribe({
      next: (bonuses) => {
        this.bonuses = [...bonuses];
        this.bonusCount = bonuses.length;
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
    console.log("Loading legs...");
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
          error instanceof Error ? error.message : "Failed to load legs";
      },
      complete: () => {
        this.isLoadingLegs = false;
      },
    });
    this.subscriptions.add(sub);
  }

  calculateTimeDifference(leg: Leg): string {
    const currentTime = new Date(new Date().toUTCString()); // Current time in UTC
    const checkpointTime = new Date(leg.CheckpointTime); // Checkpoint time in UTC
    const timeDiff = Math.abs(currentTime.getTime() - checkpointTime.getTime());
    const hours = Math.floor(timeDiff / (1000 * 60 * 60)); // Total hours
    const minutes = Math.floor((timeDiff / (1000 * 60)) % 60); // Minutes remainder
    return `${hours}h ${minutes}m`;
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
