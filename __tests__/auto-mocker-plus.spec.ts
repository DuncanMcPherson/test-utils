import { AutoMockerPlus, readObservableErrorSynchronously, readObservableSynchronously } from "../src";
import { forkJoin, Observable, of } from "rxjs";
import { TestEmissionsCounter } from "../src/test-emissions-counter";

class TestMockClass {
	public getObservable$(): Observable<boolean> {
		return of(true);
	}

	public getUpdatedValue(key: string): Observable<boolean> {
		return key === 'false' ? of(false) : of(true);
	}

	public testProperty$ = of('I am a silly string');
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
	});

	describe('withReturnNonCompletingCountedObservable', () => {
		it('should throw an error when method is not a spy', () => {
			const fn = () => undefined;
			expect(() => autoMockerPlus.withReturnNonCompletingCountedObservable(fn)).toThrow();
		});

		it('should return a counted subscription', (done) => {
			const value = Math.floor(Math.random() * 100) > 50;
			const result = autoMockerPlus.withReturnNonCompletingCountedObservable(mock.getObservable$, value);

			result.countedObservable$.subscribe((res) => {
				expect(res).toEqual(value);
				expect(result.hasActiveSubscribers).toEqual(true);
				expect(result.activeSubscriptionCount).toEqual(1);
				done();
			})
		})
	})

	describe("withReturnObservables", () => {
		test("it should throw an error when method is not a spy", () => {
			const fn = () => undefined;
			expect(() => autoMockerPlus.withReturnObservables(fn, [])).toThrow();
		});

		test('it should return new observables on each call', (done) => {
			const values = [false, true];

			autoMockerPlus.withReturnObservables(mock.getObservable$, values);
			const resArray: Observable<boolean>[] = [];
			for (let i = 0; i < values.length; i++) {
				resArray.push(mock.getObservable$());
			}
			forkJoin(resArray).subscribe((results) => {
				expect(results.length).toEqual(values.length);
				expect(results).toEqual(values);
				done();
			});
		});

		test("should return new observables when input is an observable", (done) => {
			const values = [of(true), of(false)];

			autoMockerPlus.withReturnObservables(mock.getObservable$, values);
			const resultsArray: Observable<boolean>[] = [];

			for (let i = 0; i < values.length; i++) {
				resultsArray.push(mock.getObservable$());
			}

			forkJoin(resultsArray).subscribe((results) => {
				expect(results.length).toEqual(values.length);
				done();
			});
		});
	});

	describe('withReturnThrowObservable', () => {
		test('should throw error when method is not a spy', () => {
			const fn = () => undefined;
			expect(() => autoMockerPlus.withReturnThrowObservable(fn)).toThrow();
		});

		test('should return observable with error on call', () => {
			autoMockerPlus.withReturnThrowObservable(mock.getObservable$, "i am an error");

			const result$ = mock.getObservable$();
			const result = readObservableErrorSynchronously(result$);
			expect(result.message).toEqual('i am an error');
		});
	});

	describe('withFirstArgMappedReturnObservable', () => {
		test('should throw error when method is not a spy', () => {
			const fn = () => undefined;
			expect(() => autoMockerPlus.withFirstArgMappedReturnObservable(fn, {})).toThrow();
		});

		test('should return mapped value when key is found', (done) => {
			const map = {
				false: true
			};

			autoMockerPlus.withFirstArgMappedReturnObservable(mock.getUpdatedValue, map, false);

			const result = mock.getUpdatedValue('false');

			result.subscribe((res) => {
				expect(res).toEqual(true);
				done();
			});
		});

		test('should return default value when key not found', (done) => {
			const map = {
				false: true
			};

			autoMockerPlus.withFirstArgMappedReturnObservable(mock.getUpdatedValue, map, false);

			const res = mock.getUpdatedValue('test key');

			res.subscribe((result) => {
				expect(result).toEqual(false);
				done();
			});
		});
	});

	describe("withReturnSubjectForObservableProperty", () => {
		test('should return value if initial value supplied', (done) => {
			autoMockerPlus.withReturnSubjectForObservableProperty(mock, 'testProperty$', "silly silly baby");
			mock.testProperty$.subscribe((result) => {
				expect(result).toEqual('silly silly baby');
				done();
			});
		});
	});

	describe('withReturnObservableForPropertyName', () => {
		test('should return value when initial value supplied', (done) => {
			autoMockerPlus.withReturnObservableForPropertyName(mock, "testProperty$", "my wife is cute");
			mock.testProperty$.subscribe((result) => {
				expect(result).toEqual('my wife is cute');
				done();
			})
		})
	})
})