import isEmpty from 'lodash/isEmpty';
import uniq from 'lodash/uniq';
import { Accessor, Constructor } from "./@types";

interface IMemberData<T> {
	readonly methodNames: readonly (keyof T)[];
	readonly definedPropertiesData: readonly IDefinedPropertyData<T>[];
}

interface IDefinedPropertyData<T> {
	readonly propertyName: keyof T;
	readonly hasSet: boolean;
	readonly hasGet: boolean;
}

export interface IMockClassOptions<T> {
	readonly additionalMethodsToMock: readonly (keyof T)[];
	readonly ignoredProperties: readonly (keyof T)[];
	readonly ignoreAllProperties: boolean;
}

const mockClassOptionsDefaults: IMockClassOptions<any> = {
	additionalMethodsToMock: [],
	ignoredProperties: [],
	ignoreAllProperties: false
}

export class AutoMocker {
	constructor() {}

	public mockClass<T>(
		ctor: Constructor<T>,
		options?: Partial<IMockClassOptions<T>>
	): T {
		const appliedOptions = {
			...mockClassOptionsDefaults as IMockClassOptions<T>,
			...options
		};

		const memberData = this.getMemberData(ctor);
		const allMethodsToMock: readonly (keyof T)[] = uniq([
			...memberData.methodNames,
			...appliedOptions.additionalMethodsToMock
		]);

		const mock = isEmpty(allMethodsToMock)
			? new (jest.fn())
			: new (jest.fn().mockImplementation(() => {
				const result: T = {} as T;
				allMethodsToMock.forEach((method: string & keyof T) => {
					result[method] = (jest.fn() as T[typeof method])
				});
				return result;
			}));

		if (!appliedOptions.ignoreAllProperties) {
			memberData.definedPropertiesData
				.filter(
					(propertyData: IDefinedPropertyData<T>) =>
						!appliedOptions.ignoredProperties.includes(propertyData.propertyName)
				)
				.forEach((propertyData: IDefinedPropertyData<T>) => {
					this.addMockDefinedProperty<T>(mock, propertyData);
				});
		}

		return mock;
	}

	/**
	 * @deprecated
	 * This method is only available for testing purposes. This is not a functional method
	 * @param mockedObj
	 * @param property
	 */
	public testGetProperty<T>(mockedObj: T, property: string): IDefinedPropertyData<T> {
		const propertyData = this.getDefinedPropertyData(mockedObj, property as keyof T);
		if (propertyData) {
			// do nothing
		}
		return propertyData;
	}

	public withCallFake<TFunction extends (...args: any) => any>(
		spy: TFunction,
		fakeFunction: (...params: Parameters<TFunction>) => ReturnType<TFunction>,
		spyName?: string
	): void {
		if (this.isSpyLike(spy)) {
			spy.mockImplementation(fakeFunction);
			return;
		}
		this.throwNotASpyError(spyName);
	}

	public withFirstArgMappedReturn<T>(
		spy: (arg1: string | number, ...args: any) => T,
		returnMap: Record<string | number, T>,
		defaultReturn: T = undefined,
		spyName?: string
	): void {
		if (this.isSpyLike(spy)) {
			spy.mockImplementation((key) =>
				Object.prototype.hasOwnProperty.call(returnMap, key)
					? returnMap[key]
					: defaultReturn
			)
			return;
		}
		this.throwNotASpyError(spyName);
	}

	public withReturnValue<T>(spy: (...args: any[]) => T, returnValue: T, spyName?: string): void {
		if (this.isSpyLike(spy)) {
			spy.mockReturnValue(returnValue);
			return;
		}
		this.throwNotASpyError(spyName);
	}

	public withReturnValues<T>(
		spy: (...args: any[]) => T,
		returnValues: T[],
		spyName?: string
	): void {
		if (this.isSpyLike(spy)) {
			let callCount = 0;
			spy.mockImplementation(() => {
				if (callCount < returnValues.length) {
					return returnValues[callCount++];
				}

				return returnValues[returnValues.length - 1];
			});
			return;
		}
		this.throwNotASpyError(spyName);
	}

	public withThrows(spy: Function, message?: string, spyName?: string): void {
		if (this.isSpyLike(spy)) {
			spy.mockImplementation(() => {
				throw new Error(message);
			})
			return;
		}
		this.throwNotASpyError(spyName)
	}

	public resetSpy(spy: Function, spyName?: string): void {
		if (this.isSpyLike(spy)) {
			spy.mockReset();
			return;
		}

		this.throwNotASpyError(spyName);
	}

	public withCallAccessorFake<T>(
		obj: T,
		key: keyof T,
		accessor: Accessor,
		fakeFunction: (params: any) => any,
		spyName?: string
	): void {
		this.withCallFake(
			this.getPropertyAccessorSpy(obj, key, accessor),
			fakeFunction,
			spyName ?? (key as string)
		);
	}

	public withReturnGetterValue<T, K extends keyof T>(
		obj: T,
		key: K,
		returnValue: T[K],
		spyName?: string
	): void {
		this.withReturnValue(this.getPropertyAccessorSpy(obj, key), returnValue, spyName);
	}

	public withReturnGetterValues<T, K extends keyof T>(
		obj: T,
		key: K,
		returnValues: T[K][],
		spyName?: string
	): void {
		this.withReturnValues(this.getPropertyAccessorSpy(obj, key), returnValues, spyName);
	}

	public withAccessorThrows<T>(
		obj: T,
		key: keyof T,
		accessor?: Accessor,
		message?: string,
		spyName?: string
	): void {
		this.withThrows(this.getPropertyAccessorSpy(obj, key, accessor), message, spyName)
	}

	public getAccessorSpy<T>(obj: T, key: keyof T, accessor?: Accessor): jest.Mock {
		return this.getPropertyAccessorSpy(obj, key, accessor);
	}

	public resetAccessorSpy<T>(obj: T, key: keyof T, accessor?: Accessor, spyName?: string): void {
		this.resetSpy(this.getPropertyAccessorSpy(obj, key, accessor), spyName);
	}

	public getCallArgs<TFunction extends (...args: any) => any>(
		spy: TFunction,
		callIndex = 0,
		spyName?: string
	): Parameters<TFunction> {
		if (this.isSpyLike(spy)) {
			return spy.mock.calls[callIndex]; // need to check to ensure that this is accurate
		}
		this.throwNotASpyError(spyName)
	}

	public getCallCount<TFunction extends (...args: any[]) => any>(
		spy: TFunction,
		spyName?: string
	): number {
		if (!this.isSpyLike(spy)) {
			this.throwNotASpyError(spyName)
		}
		return spy.mock.calls.length;
	}

	private getMemberData<T>(ctor: Constructor<T>): IMemberData<T> {
		const methodNames: (keyof T)[] = [];
		const definedPropertiesData: IDefinedPropertyData<T>[] = [];

		let currentPrototype: any = ctor.prototype;
		do {
			if (currentPrototype.constructor.name === 'Object') {
				break;
			}

			(Object.getOwnPropertyNames(currentPrototype) as (keyof T)[]).forEach((memberName) => {
				if (memberName === 'constructor') {
					return;
				}
				const propertyData = this.getDefinedPropertyData(currentPrototype, memberName);
				if (propertyData && (propertyData.hasGet || propertyData.hasSet)) {
					definedPropertiesData.push(propertyData);
					return;
				}

				if (this.isFunction(currentPrototype[memberName])) {
					methodNames.push(memberName);
					return;
				}
			})
		} while ((currentPrototype = Object.getPrototypeOf(currentPrototype)));

		return {
			methodNames,
			definedPropertiesData
		};
	}

	private getDefinedPropertyData<T>(obj: T, propertyName: keyof T): IDefinedPropertyData<T> {
		try {
			const descriptor = Object.getOwnPropertyDescriptor(obj, propertyName);
			return {
				propertyName: propertyName,
				hasGet: descriptor && this.isFunction(descriptor.get),
				hasSet: descriptor && this.isFunction(descriptor.set)
			}
		} catch {
			return null;
		}
	}

	private addMockDefinedProperty<T>(mock: T, propertyData: IDefinedPropertyData<T>): void {
		const attributes = {
			get: propertyData.hasGet ? jest.fn() : undefined,
			set: propertyData.hasSet ? jest.fn() : undefined,
			configurable: true
		};
		Object.defineProperty(mock, propertyData.propertyName, attributes);
		this.mockAsProperty(mock, propertyData.propertyName);
	}

	private mockAsProperty<T extends {}>(objectToMock: T, key: keyof T): boolean {
		let descriptor: PropertyDescriptor;
		do {
			descriptor = Object.getOwnPropertyDescriptor(objectToMock, key);
		} while (!descriptor && (objectToMock = Object.getPrototypeOf(objectToMock)));

		return !!(descriptor && (descriptor.get || descriptor.set));
	}

	private getPropertyAccessorSpy<T>(
		objectToMock: T,
		key: keyof T,
		accessor: Accessor = "get"
	): any {
		let descriptor: PropertyDescriptor;
		do {
			descriptor = Object.getOwnPropertyDescriptor(objectToMock, key);
		} while (!descriptor && (objectToMock = Object.getPrototypeOf(objectToMock)));

		if (!descriptor) {
			return null;
		}

		return descriptor[accessor];
	}

	protected throwNotASpyError(spyName = "[spyName not provided]"): never {
		throw new Error(`Provided spy ${spyName} is not an actual spy.`)
	}

	private isFunction(value: any): value is Function {
		return typeof value === 'function';
	}

	protected isSpyLike(value: any): value is jest.SpyInstance {
		return value && !!value.mock?.calls;
	}
}
