/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {},
  testRunner: 'jest-jasmine2',
  collectCoverage: true,
  coverageProvider: 'v8',
  coverageDirectory: './test-results/coverage',
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  reporters: ['default', 'jest-junit']
};