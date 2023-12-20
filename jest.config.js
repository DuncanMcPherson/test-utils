/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {},
  collectCoverage: true,
  coverageProvider: 'v8',
  coverageDirectory: './test-results/coverage',
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  reporters: ['default', 'jest-junit']
};