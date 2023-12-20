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

	public getPromise(): Promise<boolean> {
		return Promise.resolve(true);
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
				throw new Error(`should have thrown error but got: ${result}`)
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
			});
		});
	});

	describe('withReturnSubjectWithCompletingCountedObservableForObservableProperty', () => {
		test('should get counter and subject with no buffer when called and no value passed', () => {
			const obj = autoMockerPlus.withReturnSubjectWithCompletingCountedObservableForObservableProperty(mock, 'testProperty$');
			expect(obj.subject["_buffer"]).toEqual([]);
			expect(obj.counter).toBeTruthy();
		});

		test("should get counter and subject with buffer when called and value passed", (done) => {
			const obj = autoMockerPlus.withReturnSubjectWithCompletingCountedObservableForObservableProperty(mock, "testProperty$", "just a simple test string");
			expect(obj.subject["_buffer"].length).toEqual(1);
			expect(obj.counter).toBeTruthy();
			mock.testProperty$.subscribe((result) => {
				expect(result).toEqual('just a simple test string');
				done();
			});
		});
	});

	describe('withReturnSubjectAsObservable', () => {
		test('should throw error when method is not a spy', () => {
			const fn = () => undefined;
			expect(() => autoMockerPlus.withReturnSubjectAsObservable(fn)).toThrow();
		});

		test('should return observable and subject for updating values when called', (done) => {
			const initial = false;
			const subject = autoMockerPlus.withReturnSubjectAsObservable(mock.getObservable$);
			let emissionNumber = 0;
			mock.getObservable$().subscribe((result) => {
				if (emissionNumber++ === 0) {
					expect(result).toEqual(false)
				} else {
					expect(result).toEqual(true);
					done();
				}
			});
			subject.next(initial);
			subject.next(true);
		});
	});

	describe('withReturnReplaySubjectAsObservable', () => {
		test('should throw error when method is not a spy', () => {
			const fn = () => undefined;
			expect(() => autoMockerPlus.withReturnReplaySubjectAsObservable(fn)).toThrow();
		});

		test('should return subject and observable when called', (done) => {
			const subject = autoMockerPlus.withReturnReplaySubjectAsObservable(mock.getObservable$);
			let emissions = 0;
			mock.getObservable$().subscribe((result) => {
				if (emissions++ === 0) {
					expect(result).toEqual(false);
				} else {
					expect(result).toEqual(true);
					done();
				}
			});
			subject.next(false);
			subject.next(true);
		});

		test('when called with initial value, result should be initial value', (done) => {
			autoMockerPlus.withReturnReplaySubjectAsObservable(mock.getObservable$, true);
			mock.getObservable$().subscribe((result) => {
				expect(result).toEqual(true);
				done();
			});
		});
	});

	describe("withReturnSubjectWithErrorAsObservable", () => {
		test("should throw error when method is not a spy", () => {
			expect(() => autoMockerPlus.withReturnSubjectWithErrorAsObservable(() => undefined)).toThrow();
		});

		test('observable should show error state when called with an error message', (done) => {
			autoMockerPlus.withReturnSubjectWithErrorAsObservable(mock.getObservable$, "test error");
			const result = mock.getObservable$();

			result.subscribe({
				next: (result) => {
					throw new Error(`should not have received result: ${result}`)
				},
				error: (err) => {
					expect(err).toEqual('test error');
					done();
				}
			});
		});

		test('observable should show error state with default error when called with no error message', (done) => {
			autoMockerPlus.withReturnSubjectWithErrorAsObservable(mock.getObservable$);
			const result = mock.getObservable$();

			result.subscribe({
				next: (result) => {
					throw new Error(`should not have received result: ${result}`);
				},
				error: (err) => {
					expect(err.message).toEqual('error');
					done();
				}
			});
		});
	});

	describe('withReturnPromise', () => {
		test('should throw error if method is not a spy', () => {
			expect(() => autoMockerPlus.withReturnPromise(() => undefined)).toThrow();
		});

		test('should return a promise that resolves', () => {
			autoMockerPlus.withReturnPromise(mock.getPromise, true);
			expect(mock.getPromise()).resolves.toEqual(true);
		});
	});

	describe('withReturnRejectedPromise', () => {
		test('should throw error if method is not a spy', () => {
			expect(() => autoMockerPlus.withReturnRejectedPromise(() => undefined)).toThrow();
		});

		test('should return a rejected promise', () => {
			autoMockerPlus.withReturnRejectedPromise(mock.getPromise, "i got rejected");
			expect(mock.getPromise()).rejects.toEqual("i got rejected");
		});
	});
});