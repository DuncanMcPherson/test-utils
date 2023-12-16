import { NEVER, Observable, of, ReplaySubject, startWith, Subject, throwError } from "rxjs";
import { AutoMocker } from "./autoMocker";
import { TestSubscriptionCounter } from './test-subscription-counter';
import { ObservablePropertyNames } from './@types';

type ObservableType<T> = T extends Observable<infer U> ? U : T;

export class AutoMockerPlus extends AutoMocker {
	public withReturnObservable<T>(
		spy: (...args: any[]) => Observable<T>,
		resolveWith?: T,
		spyName?: string
	): Observable<T> {
		if (this.isSpyLike(spy)) {
			const observable: Observable<T> = of(resolveWith);
			spy.mockReturnValue(observable);
			return observable;
		}

		this.throwNotASpyError(spyName);
	}

	public withReturnNonEmittingObservable<T>(
		spy: (...args: any[]) => Observable<T>,
		spyName?: string
	): Observable<T> {
		if (this.isSpyLike(spy)) {
			const observable: Observable<T> = NEVER;
			spy.mockReturnValue(observable);
			return observable;
		}
		this.throwNotASpyError(spyName);
	}

	public withReturnCompletingCountedObservable<T>(
		spy: (...args: any[]) => Observable<T>,
		nextValue?: T,
		spyName?: string
	): TestSubscriptionCounter<T> {
		if (this.isSpyLike(spy)) {
			const observable: Observable<T> = of(nextValue);
			const counter = new TestSubscriptionCounter(observable);
			spy.mockReturnValue(counter.countedObservable$);
			return counter;
		}
		this.throwNotASpyError(spyName);
	}

	public withReturnNonCompletingCountedObservable<T>(
		spy: (...args: any[]) => Observable<T>,
		nextValue?: T,
		spyName?: string
	): TestSubscriptionCounter<T> {
		if (this.isSpyLike(spy)) {
			const nonCompletingObservable: Observable<T> = NEVER.pipe(startWith(nextValue));
			const counter = new TestSubscriptionCounter(nonCompletingObservable);
			spy.mockReturnValue(counter.countedObservable$);
			return counter;
		}
		this.throwNotASpyError(spyName);
	}

	public withReturnObservables<T>(
		spy: (...args: any[]) => Observable<T>,
		resolveWith: T[],
		spyName?: string
	): Observable<T>[] {
		if (this.isSpyLike(spy)) {
			const observables: Observable<T>[] = resolveWith.map((r) => {
				if (r instanceof Observable) {
					return r;
				}
				return of(r);
			});
			this.withReturnValues(spy, observables);
			return observables;
		}
		this.throwNotASpyError(spyName)
	}

	public withReturnThrowObservable<T>(
		spy: (...args: any[]) => Observable<T>,
		error?: any,
		spyName?: string
	): Observable<T> {
		if (this.isSpyLike(spy)) {
			const observable: Observable<T> = throwError(error);
			spy.mockReturnValue(observable);
			return observable;
		}
		this.throwNotASpyError(spyName)
	}

	public withFirstArgMappedReturnObservable<T>(
		spy: (arg1: string | number, ...args: any[]) => Observable<T>,
		returnMap: Record<string | number, T>,
		defaultReturn: T = undefined,
		spyName?: string,
	): void {
		if (this.isSpyLike(spy)) {
			spy.mockImplementation((key) =>
				Object.prototype.hasOwnProperty.call(returnMap, key)
					? of(returnMap[key])
					: of(defaultReturn)
			);
			return;
		}
		this.throwNotASpyError(spyName);
	}

	public withReturnSubjectForObservableProperty<
		T,
		K extends ObservablePropertyNames<T, any>,
		U extends ObservableType<T[K]>,
	>(
		objectMock: T,
		observablePropertyName: K,
		initialValue?: U,
		replayBuffer = 1
	): ReplaySubject<U> {
		const subject = new ReplaySubject<U>(replayBuffer);
		(objectMock[observablePropertyName] as any) = subject.asObservable();
		if (initialValue !== undefined) {
			subject.next(initialValue);
		}
		return subject;
	}

	public withReturnObservableForPropertyName<
		T,
		K extends ObservablePropertyNames<T, any>,
		U extends ObservableType<T[K]>
	>(
		objectMock: T,
		observablePropertyName: K,
		initialValue?: U,
		replayBuffer = 1
	): Subject<U> {
		const subject = new ReplaySubject<U>(replayBuffer);
		(objectMock[observablePropertyName] as any) = subject.asObservable();
		if (initialValue !== undefined) {
			subject.next(initialValue);
		}
		return subject;
	}

	public withReturnSubjectWithCompletingCountedObservableForObservableProperty<
		T,
		K extends ObservablePropertyNames<T, any>,
		U extends ObservableType<T[K]>,
	>(
		objectMock: T,
		observablePropertyName: K,
		initialValue?: U,
		replayBuffer = 1,
	): {
		subject: ReplaySubject<U>;
		counter: TestSubscriptionCounter<U>;
	} {
		const subject = new ReplaySubject<U>(replayBuffer);
		const counter = new TestSubscriptionCounter(subject.asObservable());
		(objectMock[observablePropertyName] as any) = counter.countedObservable$;
		if (initialValue !== undefined) {
			subject.next(initialValue);
		}
		return {
			subject,
			counter,
		};
	}

	public withReturnSubjectAsObservable<T>(
		spy: (...args: any[]) => Observable<T>,
		resolveWith?: T,
		spyName?: string,
	): Subject<T> {
		if (this.isSpyLike(spy)) {
			const subject: Subject<T> = new Subject<T>();
			if (resolveWith !== undefined) {
				subject.next(resolveWith);
			}
			const observable: Observable<T> = subject.asObservable();
			spy.mockReturnValue(observable);
			return subject;
		}
		this.throwNotASpyError(spyName)
	}

	public withReturnReplaySubjectAsObservable<T>(
		spy: (...args: any[]) => Observable<T>,
		resolveWith?: T,
		bufferSize = 1,
		spyName?: string,
	): ReplaySubject<T> {
		if (this.isSpyLike(spy)) {
			const subject = new ReplaySubject<T>(bufferSize);
			if (resolveWith !== undefined) {
				subject.next(resolveWith);
			}
			const observable = subject.asObservable();
			spy.mockReturnValue(observable);
			return subject;
		}
		this.throwNotASpyError(spyName);
	}

	public withReturnSubjectWithErrorAsObservable<T>(
		spy: (...args: any[]) => Observable<T>,
		resolveWithError?: any,
		spyName?: string,
	): Subject<T> {
		if (this.isSpyLike(spy)) {
			const subject = new Subject<T>();
			if (resolveWithError) {
				subject.error(resolveWithError);
			} else {
				subject.error(new Error("error"));
			}
			const observable: Observable<T> = subject.asObservable();
			spy.mockReturnValue(observable);
			return subject;
		}
		this.throwNotASpyError(spyName);
	}

	public withReturnPromise<T>(
		spy: (...args: any[]) => Promise<T>,
		resolveWith?: T,
		spyName?: string,
	): Promise<T> {
		if (this.isSpyLike(spy)) {
			const promise = Promise.resolve(resolveWith);
			spy.mockReturnValue(promise);
			return promise;
		}
		return this.throwNotASpyError(spyName);
	}

	public withReturnRejectedPromise<T>(
		spy: (...args: any[]) => Promise<T>,
		rejectWith?: any,
		spyName?: string,
	): Promise<T> {
		if (this.isSpyLike(spy)) {
			const promise = Promise.reject(rejectWith);
			spy.mockReturnValue(promise);
			return promise;
		}
		return this.throwNotASpyError(spyName);
	}
}
