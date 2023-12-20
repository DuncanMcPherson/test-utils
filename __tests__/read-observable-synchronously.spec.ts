// noinspection ExceptionCaughtLocallyJS

import { BehaviorSubject, Observable, Subject } from "rxjs";
import {
	readObservableCompletionSynchronously,
	readObservableErrorSynchronously,
	readObservableSynchronouslyAfterAction
} from "../src";

describe('readObservableSynchronouslyAfterAction', () => {
	test('should fail test when no observable is supplied', () => {
		try {
			const observable: Observable<any> = undefined;
			const action = () => {
			};
			const value = readObservableSynchronouslyAfterAction(observable, action);
			throw new Error(`should not have received value: ${value}`);
		} catch (e) {
			expect(e.message).toEqual('cannot subscribe to undefined')
		}
	});

	test('should fail test when no action is defined', () => {
		try {
			const observable: Observable<any> = new Observable<any>();
			const action = undefined;

			const value = readObservableSynchronouslyAfterAction(observable, action);
			throw new Error(`should not have received value: ${value}`);
		} catch (e) {
			expect(e.message).toEqual('action (undefined) is required')
		}
	});

	test('should fail if observable does not emit', () => {
		const observable: Subject<any> = new Subject();
		const action = () => {};
		try {
			const value = readObservableSynchronouslyAfterAction(observable, action);
			throw new Error(`should not have received value: ${value}`)
		} catch (e) {
			expect(e.message.includes('observable did not emit')).toEqual(true);
		}
	});

	test('should fail if observable throws an error', () => {
		const observable = new Subject();
		const action = () => {
			observable.error('test error');
		}

		try {
			const value = readObservableSynchronouslyAfterAction(observable, action);
			throw new Error(`should not have received value: ${value}`)
		} catch (e) {
			expect(e.message).toEqual('test error')
		}
	});

	test('should succeed if observable emits and no errors are thrown', () => {
		const observable = new Subject<number>();
		const expected = Math.floor(Math.random() * 100);
		const action = () => {
			observable.next(expected);
		}

		const value = readObservableSynchronouslyAfterAction(observable, action);
		expect(value).toEqual(expected)
	});
});

describe('readObservableErrorSynchronously', () => {
	test('should fail if observable emits', () => {
		const observable = new BehaviorSubject(Math.floor(Math.random() * 1000));
		try {
			const value = readObservableErrorSynchronously(observable);
			throw new Error(`should not have received a value: ${value}`);
		} catch(e) {
			expect(isNaN(e.message)).toEqual(false);
		}
	});

	test('should fail if observable not supplied', () => {
		try {
			const value = readObservableErrorSynchronously(undefined);
			throw new Error(`should not have received value: ${value}`);
		} catch (e) {
			expect(e.message).toEqual('cannot subscribe to undefined')
		}
	});

	test('should fail if observable never emits', () => {
		try {
			const observable = new Subject();
			const value = readObservableErrorSynchronously(observable);
			throw new Error(`should not have received value: ${value}`);
		} catch (e) {
			expect(e.message.includes('observable did not emit')).toEqual(true);
		}
	});
});

describe('readObservableCompletionSynchronously', () => {
	test('should fail if observable is not supplied', () => {
		try {
			const value = readObservableCompletionSynchronously(undefined);
			throw new Error(`should not have received value: ${value}`);
		} catch (e) {
			expect(e.message).toEqual('cannot subscribe to undefined')
		}
	});

	test('should fail if observable never emits', () => {
		try {
			const observable = new Subject();
			const value = readObservableCompletionSynchronously(observable);
			throw new Error(`should not have received value: ${value}`);
		} catch (e) {
			expect(e.message.includes('observable did not emit')).toEqual(true);
		}
	});

	test('should fail if observable throws error', () => {
		try {
			const observable = new Subject();
			observable.error(Math.floor(Math.random() * 1000));
			const value = readObservableCompletionSynchronously(observable);
			throw new Error(`should not have received value: ${value}`);
		} catch (e) {
			expect(isNaN(e.message)).toEqual(false);
		}
	});

	test('should fail if observable emits', () => {
		try {
			const observable = new BehaviorSubject(Math.floor(Math.random() * 1000));
			const value = readObservableCompletionSynchronously(observable);
			throw new Error(`should not have received value: ${value}`);
		} catch (e) {
			expect(isNaN(e.message)).toEqual(false);
		}
	});

	test('should succeed when observable completes', () => {
		const observable = new Subject();
		observable.complete();
		const value = readObservableCompletionSynchronously(observable);

		expect(value).toEqual(true);
	})
})