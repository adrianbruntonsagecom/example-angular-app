import { Component } from "@angular/core";
import { CurrentDateComponent } from "./current-date/current-date.component";

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  imports: [CurrentDateComponent],
  standalone: true,
})
export class AppComponent {}
