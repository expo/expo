/* global jasmine */

const { cleanup } = require('detox');
const adapter = require('detox/runners/jest/adapter');
const specReporter = require('detox/runners/jest/specReporter');
const { launchWithPermissionsAsync } = require('../Utils');
const config = require('../../package.json').detox;

// Set the default timeout
jest.setTimeout(160000);
jasmine.getEnv().addReporter(adapter);

// This takes care of generating status logs on a per-spec basis. By default, jest only reports at file-level.
// This is strictly optional.
jasmine.getEnv().addReporter(specReporter);

const permissions = {
  calendar: true,
  contacts: true,
  medialibrary: true,
  microphone: true,
  motion: true,
  notifications: true,
  photos: true,
  reminders: true,
  speech: true,
  // location: 'always', // inuse, never, unset
  // camera: true,
  // faceid: true,
  // homekit: true,
  // siri: true,
  // // (iOS 12.0 and above)
  // health: true,
};

beforeAll(async () => {
  await launchWithPermissionsAsync(config, permissions, { initGlobals: false, reuse: false });
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await cleanup();
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
