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
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  reporters: ['default', 'jest-junit']
};