import { AutoMocker } from "../src/autoMocker";

class TestMockClass {
	public newProperty: number = 85;
	public oldProperty: number = 12;

	public updateProperty(newValue: number): void {
		this.newProperty = newValue;
	}

	public getPropertyValue<K extends keyof this>(property: K): this[K] {
		return this[property];
	}

	public get NewProp(): number {
		return this.newProperty;
	}

	public logCurrentProperty(): void {
		console.log(this.newProperty);
	}
}

describe("AutoMocker", () => {
	let autoMocker: AutoMocker;

	beforeAll(() => {
		autoMocker = new AutoMocker();
	})
	describe("mockClass", () => {
		test('should create an instance of the mockedClass', () => {
			let mock = autoMocker.mockClass(TestMockClass);

			expect(mock).toBeTruthy();
			expect(mock.newProperty).toBeUndefined();
		});

	});

	describe('withCallFake', () => {
		test('should change implementation', () => {
			const mock = autoMocker.mockClass(TestMockClass);
			let fakeCalled = false;
			const newFunction = (newValue: number) => {
				mock.newProperty = newValue;
				fakeCalled = true;
			}

			autoMocker.withCallFake(mock.updateProperty, newFunction);

			mock.updateProperty(10);

			expect(fakeCalled).toEqual(true);
			expect(mock.newProperty).toEqual(10);
		});

		test('should throw error when non spy mocked', () => {
			const spy = () => undefined;

			try {
				autoMocker.withCallFake(spy, () => 1);
				fail('should throw error')
			} catch (e) {
				expect(e).toBeTruthy();
			}
		})
	});

	describe('withFirstArgMappedReturn', () => {
		test('should return the proper value', () => {
			const mock = autoMocker.mockClass(TestMockClass);

			// @ts-ignore
			autoMocker.withFirstArgMappedReturn(mock.getPropertyValue, {'newProperty': 55});

			const result = mock.getPropertyValue('newProperty');

			expect(result).toEqual(55)
		});

		test('should throw error when non spy mocked', () => {
			const spy = () => undefined;

			try {
				autoMocker.withFirstArgMappedReturn(spy, () => 1);
				fail('should throw error')
			} catch (e) {
				expect(e).toBeTruthy();
			}
		})
	});

	describe('withReturnValue', () => {
		test('should return the proper value', () => {
			const mock = autoMocker.mockClass(TestMockClass)

			autoMocker.withReturnValue(mock.getPropertyValue, 101);

			const result = mock.getPropertyValue('oldProperty');

			expect(result).toEqual(101);
		});

		test('should throw error when non spy mocked', () => {
			const spy = () => undefined;

			try {
				autoMocker.withReturnValue(spy, () => 1);
				fail('should throw error')
			} catch (e) {
				expect(e).toBeTruthy();
			}
		})
	});

	describe('withReturnValues', () => {
		test('Should return the correct values when length is equal to expected returns length', () => {
			const mock = autoMocker.mockClass(TestMockClass);
			const returnValues = [13, 34, 57, 123, 67, 243, 2345];
			autoMocker.withReturnValues(mock.getPropertyValue, returnValues);

			const results = [];
			let i = returnValues.length;

			while (i > 0) {
				results.push(mock.getPropertyValue('newProperty'));
				i--;
			}

			expect(results.length).toEqual(returnValues.length);
			expect(results).toEqual(returnValues)
		});

		test('should continue to return the last value on extra calls', () => {
			const mock = autoMocker.mockClass(TestMockClass);
			const returnValues = [12, 23, 34, 45];
			autoMocker.withReturnValues(mock.getPropertyValue, returnValues);

			const results = [];
			let i = 0;
			while (i++ < returnValues.length + 5) {
				results.push(mock.getPropertyValue('newProperty'));
			}

			expect(results.length).toEqual(returnValues.length + 5);
			expect(results.slice(returnValues.length - 1).every(v => v === returnValues[returnValues.length - 1])).toEqual(true);
		});

		test('should throw error when non spy mocked', () => {
			const spy = () => undefined;

			try {
				autoMocker.withReturnValues(spy, []);
				fail('should throw error')
			} catch (e) {
				expect(e).toBeTruthy();
			}
		})
	});

	describe("withThrows", () => {
		[
			{
				error: undefined,
				expected: ''
			},
			{
				error: 'test error',
				expected: 'test error'
			}
		].forEach((testCase) => {
			test(`should have error of: ${testCase.error} when called`, () => {
				const mock = autoMocker.mockClass(TestMockClass);
				autoMocker.withThrows(mock.updateProperty, testCase.error);

				try {
					mock.updateProperty(Math.floor(Math.random() * 10));
					fail('Should have thrown error')
				} catch (e) {
					expect(e.message).toEqual(testCase.expected);
				}
			});
		});

		test('should throw error when non spy mocked', () => {
			const spy = () => undefined;

			try {
				autoMocker.withThrows(spy);
				fail('should throw error')
			} catch (e) {
				expect(e).toBeTruthy();
			}
		});
	});

	describe('resetSpy', () => {
		test('should throw error when non spy mocked', () => {
			const spy = () => undefined;

			try {
				autoMocker.resetSpy(spy);
				fail('should throw error')
			} catch (e) {
				expect(e).toBeTruthy();
			}
		})

		test('should reset spy', () => {
			const mock = autoMocker.mockClass(TestMockClass);
			mock.updateProperty(1);

			expect((mock.updateProperty as jest.Mock).mock.calls.length).toEqual(1);

			autoMocker.resetSpy(mock.updateProperty);

			expect((mock.updateProperty as jest.Mock).mock.calls.length).toEqual(0);
		});
	});

	describe('withCallAccessorFake', () => {
		test('should change the implementation', () => {
			const mock = autoMocker.mockClass(TestMockClass);

			let updatedImplementation = false;

			const newImplementation = (): number => {
				updatedImplementation = true;
				return mock.newProperty;
			};

			autoMocker.withCallAccessorFake(mock, 'NewProp', 'get', newImplementation);

			const result = mock.NewProp;

			expect(result).toEqual(mock.newProperty);
			expect(updatedImplementation).toBe(true);
		});
	});

	describe('withReturnGetterValue', () => {
		test('should set the return value', () => {
			const mock = autoMocker.mockClass(TestMockClass);

			autoMocker.withReturnGetterValue(mock, 'NewProp', 3);

			const result = mock.NewProp;

			expect(result).toEqual(3)
		});
	});

	describe('withReturnGetterValues', () => {
		test('should set the return values', () => {
			const mock = autoMocker.mockClass(TestMockClass);
			const returnValues = [1,2,3,4,5];

			autoMocker.withReturnGetterValues(mock, 'NewProp', returnValues);

			const result = [];

			for (let i = 0; i < returnValues.length; i++) {
				result.push(mock.NewProp);
			}

			expect(result.length).toEqual(returnValues.length);
			expect(result).toEqual([1,2,3,4,5]);
		});
	});

	describe('withAccessorThrows', () => {
		test('should throw error when called', () => {
			const mock = autoMocker.mockClass(TestMockClass);

			autoMocker.withAccessorThrows(mock, 'NewProp', 'get', 'Test error');

			try {
				const value = mock.NewProp;
				fail(`Should not have gotten value: ${value}`);
			} catch(e) {
				expect(e.message).toEqual('Test error');
			}
		});
	});

	describe('resetAccessorSpy', () => {
		test('should reset spy', () => {
			const mock = autoMocker.mockClass(TestMockClass);
			mock.NewProp;

			const spy = autoMocker.getAccessorSpy(mock, 'NewProp', 'get');
			expect(spy.mock.calls.length).toEqual(1);

			autoMocker.resetAccessorSpy(mock, 'NewProp', 'get')

			expect(spy.mock.calls.length).toEqual(0);
		});

		test('should return null', () => {
			const mock = autoMocker.mockClass(TestMockClass);
			const spy = autoMocker.getAccessorSpy(mock, 'test' as keyof TestMockClass);
			expect(spy).toBeFalsy();
		});
	});

	describe('getCallArgs', () => {
		test('should get the arguments from the most recent call', () => {
			const mock = autoMocker.mockClass(TestMockClass);
			mock.updateProperty(123);

			const result = autoMocker.getCallArgs(mock.updateProperty);

			expect(result).toEqual([123]);
		});

		test('should throw error if function is not a spy', () => {
			const fn = () => undefined;

			try {
				const result = autoMocker.getCallArgs(fn);
				fail(`Should not have succeeded: ${result}`);
			} catch (e) {
				expect(e).toBeTruthy();
			}
		});
	});

	describe('getCallCount', () => {
		test("should return the correct call count", () => {
			const mock = autoMocker.mockClass(TestMockClass);
			const callCount = autoMocker.getCallCount(mock.logCurrentProperty);
			expect(callCount).toEqual(0);

			mock.logCurrentProperty();

			const calls = autoMocker.getCallCount(mock.logCurrentProperty);

			expect(calls).toEqual(1);
		});

		test('should throw error when function is not a spy', () => {
			const fn = () => undefined;
			try {
				autoMocker.getCallCount(fn);
				fail('should have thrown an error')
			} catch (e) {
				expect(e).toBeTruthy();
			}
		});
	});

	describe('testGetProperty', () => {
		test('should return null if property does not exist', () => {
			const propertyData = autoMocker.testGetProperty(undefined, 'not a real property')

			expect(propertyData).toBeFalsy();
		});

		test('should return property data when available', () => {
			const mock = autoMocker.mockClass(TestMockClass);
			const propertyData = autoMocker.testGetProperty(mock, 'updateProperty');

			expect(propertyData).toBeTruthy();
		})
	})
})