import { CurrentDateComponent } from "./current-date.component";
import { Spectator, createComponentFactory } from "@ngneat/spectator";
import { MockComponent } from "ng-mocks";
import { LoaderComponent } from "../loader/loader.component";
import { CurrentDateService } from "./current-date.service";
import { EMPTY, of, tap, throwError } from "rxjs";
import { DateFormat } from "./current-date.types";

describe("CurrentDateComponent", () => {
  let spectator: Spectator<CurrentDateComponent>;
  let currentDateService: jasmine.SpyObj<CurrentDateService>;

  const queryDate = () => spectator.query(".date");
  const queryError = () => spectator.query(".error");
  const queryLoader = () => spectator.query(LoaderComponent);

  const createComponent = createComponentFactory({
    component: CurrentDateComponent,
    imports: [
      MockComponent(LoaderComponent), // Ensures child component isn't rendered
    ],
    detectChanges: false, // Let tests handle when to initialize
  });

  beforeEach(() => {
    // Each test should define its own test data by stubbing the relevant spy objects. This avoids
    // cross purpose test data where changing values may break tests elsewhere unexpectedly.
    currentDateService = jasmine.createSpyObj<CurrentDateService>([
      "getCurrentDate",
    ]);
    spectator = createComponent({
      providers: [
        { provide: CurrentDateService, useValue: currentDateService },
      ],
    });
  });

  it("should create", () => {
    expect(spectator).toBeTruthy();
  });

  it("should request data only once on load", () => {
    const date = new Date(2025, 2, 19);
    currentDateService.getCurrentDate.and.returnValue(of(date));
    spectator.detectChanges();
    expect(currentDateService.getCurrentDate).toHaveBeenCalledTimes(1);
  });

  it("should show loading component when observable completes with no items", () => {
    currentDateService.getCurrentDate.and.returnValue(EMPTY);
    spectator.detectChanges();

    // Using component class name rather than element name so it's verified at compile time
    expectStateDisplayed("loading");
  });

  it("should show loading component before a value is displayed", () => {
    const date = new Date(2025, 2, 19);
    currentDateService.getCurrentDate.and.returnValue(
      of(date).pipe(
        tap(() => {
          // Loading component is shown whilst observable has no yet returned
          spectator.detectChanges();
          expectStateDisplayed("loading");
        })
      )
    );

    // Observable returns with data so loading component is hidden and expected date is displayed.
    spectator.detectChanges();
    expectStateDisplayed("data");

    // Using toHaveExactTrimmedText to we're being specific but also not worrying about trailing white space as the template is reformatted with prettier.
    expect(queryDate()).toHaveExactTrimmedText("Mar 19, 2025, 12:00:00 AM");
  });

  it("should show loading component before new data is requested", () => {
    // We have data already
    const date = new Date(2025, 2, 19);
    currentDateService.getCurrentDate.and.returnValue(of(date));
    spectator.detectChanges();
    expectStateDisplayed("data");

    const newDate = new Date(2025, 11, 25);
    currentDateService.getCurrentDate.and.returnValue(
      of(newDate).pipe(
        tap(() => {
          // Loading component is shown whilst observable has no yet returned
          spectator.detectChanges();
          expectStateDisplayed("loading");
        })
      )
    );

    // Trigger the event handler
    spectator.triggerEventHandler("button", "click", {});

    spectator.detectChanges();

    expectStateDisplayed("data");
    expect(queryDate()).toHaveExactTrimmedText("Dec 25, 2025, 12:00:00 AM");
  });

  describe("error state", () => {
    it("should display expected error message if initial load fails", () => {
      currentDateService.getCurrentDate.and.returnValue(
        throwError(() => new Error("It broke"))
      );
      spectator.detectChanges();

      expectStateDisplayed("error");
      expect(queryError()).toHaveExactTrimmedText("It broke");
    });

    it("should display expected error message when no message provided", () => {
      currentDateService.getCurrentDate.and.returnValue(
        throwError(() => new Error())
      );
      spectator.detectChanges();

      expectStateDisplayed("error");
      expect(queryError()).toHaveExactTrimmedText("An error occurred");
    });

    it("should display expected error message when unexpected error object provided", () => {
      currentDateService.getCurrentDate.and.returnValue(
        throwError(() => ({
          error: "Something went wrong",
        }))
      );
      spectator.detectChanges();

      expectStateDisplayed("error");
      expect(queryError()).toHaveExactTrimmedText("An error occurred");
    });

    it("should display expected error message if additional load fails", () => {
      const date = new Date(2025, 2, 19);
      currentDateService.getCurrentDate.and.returnValue(of(date));
      spectator.detectChanges();
      expectStateDisplayed("data");

      currentDateService.getCurrentDate.and.returnValue(
        throwError(() => new Error("It broke"))
      );

      // Trigger the event handler
      spectator.triggerEventHandler("button", "click", {});

      expectStateDisplayed("error");
      expect(queryError()).toHaveExactTrimmedText("It broke");
    });
  });

  describe("date format", () => {
    const testDate = new Date(2025, 2, 19, 16, 15, 39);
    // This is going into the territory of testing code that's not ours (the date format pipe), but isn't
    // necessarily an invalid test given it shows the format input is being used.
    const formatTestcases: Record<DateFormat, string> = {
      short: "3/19/25, 4:15 PM",
      medium: "Mar 19, 2025, 4:15:39 PM",
      long: "March 19, 2025 at 4:15:39 PM GMT+0",
      full: "Wednesday, March 19, 2025 at 4:15:39 PM GMT+00:00",
    };

    Object.keys(formatTestcases).forEach((format) => {
      it(`should show expected format for ${format} format`, () => {
        currentDateService.getCurrentDate.and.returnValue(of(testDate));
        spectator.setInput("format", format as DateFormat); // Set input calls ngOnChanges

        const expectedFormat = formatTestcases[format as DateFormat];
        expectStateDisplayed("data");
        expect(queryDate()).toHaveExactTrimmedText(expectedFormat);
      });
    });
  });

  function expectStateDisplayed(state: "data" | "error" | "loading") {
    switch (state) {
      case "data":
        expect(queryDate()).toExist();
        expect(queryError()).not.toExist();
        expect(queryLoader()).not.toExist();
        break;

      case "error":
        expect(queryDate()).not.toExist();
        expect(queryError()).toExist();
        expect(queryLoader()).not.toExist();
        break;

      case "loading":
        expect(queryDate()).not.toExist();
        expect(queryError()).not.toExist();
        expect(queryLoader()).toExist();
        break;
    }
  }
});
