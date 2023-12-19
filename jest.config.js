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
      branches: 90,
      functions: 93,
      lines: 92,
      statements: 92
    }
  },
  reporters: ['default', 'jest-junit']
};