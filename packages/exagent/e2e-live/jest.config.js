/* eslint-env node */
// @ref llp/0022-live-tier.plan.md §A jest project of its own, run by nothing else
//
// A fourth jest project beside `jest.config.js` (unit) and `e2e/jest.config.js` (stub e2e). It is
// deliberately reachable only through `test:live*`: no `test`, no `test:e2e` and no CI default
// names it, because every suite here spends a real simulator, a real account or a real deployment.
const path = require('node:path');

/** @type {import('jest').Config} */
module.exports = {
  ...require('expo-module-scripts/jest-preset-cli'),
  testEnvironment: 'node',
  testRegex: '/__tests__/.*(test|spec)\\.[jt]sx?$',
  rootDir: path.resolve(__dirname),
  displayName: 'exagent-e2e-live',
  roots: ['__tests__'],
  // The fixtures are project source that gets copied into a scratch project, never modules of this
  // one. `livecheck/` in particular carries its own `package.json` with the name `livecheck`.
  modulePathIgnorePatterns: ['<rootDir>/fixtures/', '<rootDir>/.artifacts/'],
  // A live run waits on a real bundler, a real simulator and a real network. Nothing here asserts a
  // timing, so the budget is generous on purpose: an expiry is a harness failure, not a finding.
  testTimeout: 900_000,
  // One worker. Two suites cannot share one simulator, one dev-server port range or one cloud
  // session, and a live tier that raced itself would report the race as the CLI's fault.
  maxWorkers: 1,
};
