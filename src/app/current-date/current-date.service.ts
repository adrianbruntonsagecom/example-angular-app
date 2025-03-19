import { Injectable } from "@angular/core";
import { map, Observable, timer } from "rxjs";

@Injectable({ providedIn: "root" })
export class CurrentDateService {
  private MAX_DELAY = 3000;

  /**
   * Mimics contacting an API to return the current date time.
   */
  public getCurrentDate(): Observable<Date> {
    const delay = Math.floor(Math.random() * this.MAX_DELAY);
    return timer(delay).pipe(map(() => new Date()));
  }
}
