import { AutoMockerPlus, readObservableSynchronously } from "../src";
import { Observable, of } from "rxjs";
import { TestEmissionsCounter } from "../src/test-emissions-counter";

class TestMockClass {
	public getObservable$(): Observable<boolean> {
		return of(true);
	}
}

describe('AutoMockerPlus', () => {
	let autoMockerPlus: AutoMockerPlus;
	let mock: TestMockClass;

	beforeEach(() => {
		autoMockerPlus = new AutoMockerPlus();
		mock = autoMockerPlus.mockClass(TestMockClass);
	});

	describe("withReturnObservable", () => {
		test("should throw error if method is not a spy", () => {
			const spy = () => undefined;

			try {
				const result = autoMockerPlus.withReturnObservable(spy);
				fail(`should have thrown error but got: ${result}`)
			} catch (e) {
				expect(e).toBeTruthy();
				expect(e.message).toBeTruthy();
				expect((e.message as string).includes("not an actual spy")).toEqual(true);
			}
		});

		[
			true,
			false,
			undefined
		].forEach((testCase) => {
			test("should return an observable with the specified value", () => {
				const result = autoMockerPlus.withReturnObservable(mock.getObservable$, testCase);

				expect(result).toBeTruthy();
				const value = readObservableSynchronously(result);
				expect(value).toEqual(testCase);
			});
		});
	});

	describe("withReturnNonEmittingObservable", () => {
		test("should throw error if method is not a spy", () => {
			const spy = () => undefined;

			expect(() => autoMockerPlus.withReturnNonEmittingObservable(spy)).toThrow();
		});

		test('observable should not emit', () => {
			autoMockerPlus.withReturnNonEmittingObservable(mock.getObservable$);

			const emissionsCounter = new TestEmissionsCounter(mock.getObservable$());
			emissionsCounter.emissionsCountingObservable$.subscribe();
			expect(emissionsCounter.emissions).toEqual(0);
		});
	});

	describe("withReturnCompletingCountedObservable", () => {
		test("should throw error if method is not a spy", () => {
			const spy = () => undefined;

			expect(() => autoMockerPlus.withReturnCompletingCountedObservable(spy)).toThrow();
		});

		test("should return a subscribed observable that does not complete", (done) => {
			const counter = autoMockerPlus.withReturnCompletingCountedObservable(mock.getObservable$, true);

			counter.countedObservable$.subscribe((result) => {
				expect(result).toEqual(true);
				expect(counter.activeSubscriptionCount).toEqual(1);
				done();
			});
			expect(counter.activeSubscriptionCount).toEqual(0);
			expect(counter.hadSubscribers).toEqual(true);
			expect(counter.hasActiveSubscribers).toEqual(false);
			expect(counter.allSubscriptionsFinalized).toEqual(true);
		});
	})
})