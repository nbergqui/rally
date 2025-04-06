import { Component, inject, computed } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { RallyStore } from "./stores/rally.store";
import { ApiService } from "./services/api.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  title = "IBR";
  apiMessage: { message: string } | null = null;

  rallyStore = inject(RallyStore);
  readonly bonusCount = computed(() => this.rallyStore.getBonusCount()());

  constructor(private apiService: ApiService) {
    this.loadHelloMessage();
    this.loadBonuses();
  }

  async loadHelloMessage() {
    try {
      this.apiMessage = await firstValueFrom(this.apiService.getHelloMessage());
      console.log("API Message Loaded:", this.apiMessage);
    } catch (error) {
      console.error("Error loading hello message:", error);
      this.apiMessage = { message: "Failed to load message" };
    }
  }

  async loadBonuses() {
    console.log("Loading bonuses...");
    await this.rallyStore.loadBonuses();
    console.log("Bonuses after load:", this.rallyStore.getBonuses()());
    console.log("Is Loading:", this.rallyStore.getIsLoading()());
    console.log("Error:", this.rallyStore.getError()());
  }
}
