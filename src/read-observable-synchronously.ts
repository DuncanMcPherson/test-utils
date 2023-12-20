import { Observable, skip, take, tap } from "rxjs";

export function readObservableSynchronously<T>(observable$: Observable<T>, skips = 0): T {
	return readObservableSynchronouslyAfterAction(observable$, () => {
		// Intentionally empty
	}, skips);
}

export function readObservableSynchronouslyAfterAction<T>(
	observable$: Observable<T>,
	action: () => void,
	skips = 0
): T {
	if (!observable$) {
		throw new Error(`cannot subscribe to ${observable$}`)
	}
	if (!action) {
		throw new Error(`action (${action}) is required`)
	}

	let actualResult: T;
	let emitted = false;
	let emissionCount = 0;
	let error: any;

	const subscription = observable$
		.pipe(
			tap(() => emissionCount++),
			skip(skips),
			take(1)
		).subscribe({
			next: (result) => {
				actualResult = result;
				emitted = true;
			},
			error: (err) => {error = err}
		});
	action();

	if (error) {
		throw new Error(error);
	}

	if (!emitted) {
		subscription.unsubscribe();
		throw new Error(
			`observable did not emit (skips requested: ${skips}, total skipped emissions: ${emissionCount})`,
		)
	}

	return actualResult;
}

export function readObservableErrorSynchronously(
	observable$: Observable<any>,
	skips = 0
): any {
	if (!observable$) {
		throw new Error(`cannot subscribe to ${observable$}`);
	}

	let actualError: any;
	let emitted = false;
	let emissionCount = 0;
	let valueReceived: any;

	const subscription = observable$
		.pipe(
			tap(() => emissionCount++),
			skip(skips),
			take(1),
		)
		.subscribe({
			next: (val) => {valueReceived = val},
			error: (error) => {
				actualError = error;
				emitted = true;
			},
		});

	if (!!valueReceived) {
		throw new Error(valueReceived)
	}

	if (!emitted) {
		subscription.unsubscribe();
		throw new Error(
			`observable did not emit error (skips requested: ${skips}, total skipped emissions: ${emissionCount})`,
		);
	}

	return actualError;
}

export function readObservableCompletionSynchronously(
	observable$: Observable<any>,
	skips = 0,
): boolean {
	if (!observable$) {
		throw new Error(`cannot subscribe to ${observable$}`);
	}

	let actualComplete: boolean;
	let emitted = false;
	let emissionCount = 0;
	let error: any;
	let value: any;

	const subscription = observable$
		.pipe(
			tap(() => emissionCount++),
			skip(skips),
			take(1),
		)
		.subscribe({
			next: (val) => {value = val},
			error: (err) => {error = err},
			complete: () => {
				actualComplete = true;
				emitted = true;
			},
		});

	if (!!value) {
		throw new Error(value);
	}

	if (!!error) {
		throw new Error(error);
	}

	if (!emitted) {
		subscription.unsubscribe();
		throw new Error(
			`observable did not emit complete (skips requested: ${skips}, total skipped emissions: ${emissionCount})`,
		);
	}

	return actualComplete;
}
