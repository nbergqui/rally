import { Component } from "@angular/core";
import { ApiService } from "./api.service";
import { Signal } from "@angular/core";

@Component({
  selector: "app-root",
  standalone: true,
  templateUrl: "./app.component.html",
  styleUrls: [],
})
export class AppComponent {
  title = "angular-hello-world";
  apiMessage: Signal<{ message: string }>;

  constructor(private apiService: ApiService) {
    this.apiMessage = this.apiService.getHelloMessage();
  }
}
