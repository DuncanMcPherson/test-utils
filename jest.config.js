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
      branches: 80,
      functions: 100,
      lines: 95,
      statements: 95
    }
  },
  reporters: ['default', 'jest-junit']
};