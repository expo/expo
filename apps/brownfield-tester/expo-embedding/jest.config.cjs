module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/__tests__/*-test.ts'],
  transform: { '^.+\\.ts$': '<rootDir>/scripts/jest-transform.cjs' },
};
