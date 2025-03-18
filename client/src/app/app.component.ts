import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Signal } from "@angular/core";
import { ApiService } from "./api.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  title = "angular-hello-world";
  apiMessage: Signal<{ message: string }>;
  budget: Signal<any | null> = signal(null); // Signal for budget data (adjust type as needed)

  constructor(private apiService: ApiService) {
    this.apiMessage = this.apiService.getHelloMessage();
    this.budget = this.apiService.getBudgetById(1); // Load budget with ID 1 by default
  }
}
