import { Component, Input } from "@angular/core";
import { LoaderComponent } from "../loader/loader.component";
import { CommonModule } from "@angular/common";
import { CurrentDateService } from "./current-date.service";
import {
  catchError,
  combineLatest,
  ignoreElements,
  map,
  Observable,
  of,
  shareReplay,
  startWith,
  Subject,
  switchMap,
} from "rxjs";
import { DateFormat } from "./current-date.types";

@Component({
  selector: "app-current-date",
  templateUrl: "./current-date.component.html",
  styleUrls: ["./current-date.component.css"],
  imports: [CommonModule, LoaderComponent],
  standalone: true, // Expect to be using standalone components where possible
})
export class CurrentDateComponent {
  // Only properties marked with input/output decorators are public
  @Input() public format: DateFormat = "medium";

  // Constructor parameters should be readonly
  constructor(private readonly currentDateService: CurrentDateService) {}

  private readonly updateTrigger$ = new Subject<void>();

  // Observable properties created by service function calls should ideally be readonly
  private readonly lastUpdatedDate$: Observable<Date | null> =
    this.updateTrigger$.pipe(
      startWith(undefined),
      switchMap(() =>
        this.currentDateService.getCurrentDate().pipe(
          map((date) => ({ date, loading: false })),
          startWith({ date: null, loading: true })
        )
      ),
      map((result) => result.date),
      shareReplay(1)
    );

  private readonly error$ = this.lastUpdatedDate$.pipe(
    ignoreElements(),
    catchError((error) => {
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : "An error occurred";
      return of(errorMessage);
    })
  );

  protected readonly data$ = combineLatest([
    this.lastUpdatedDate$.pipe(catchError(() => of(null))),
    this.error$.pipe(startWith(null)),
  ]).pipe(map(([lastUpdated, error]) => ({ lastUpdated, error })));

  protected updateDate() {
    this.updateTrigger$.next();
  }
}
