/* global device jasmine */

const detox = require('detox');
const adapter = require('detox/runners/jest/adapter');
const specReporter = require('detox/runners/jest/specReporter');
const config = require('../package.json').detox;

// Set the default timeout
jest.setTimeout(120000);
jasmine.getEnv().addReporter(adapter);

// This takes care of generating status logs on a per-spec basis. By default, jest only reports at file-level.
// This is strictly optional.
jasmine.getEnv().addReporter(specReporter);

const permissions = {
  // location: 'always', // inuse, never, unset
  // calendar: true,
  // camera: true,
  // contacts: true,
  // faceid: true,
  // homekit: true,
  // medialibrary: true,
  // microphone: true,
  // motion: true,
  // notifications: true,
  // photos: true,
  // reminders: true,
  // siri: true,
  // speech: true,
  // // (iOS 12.0 and above)
  // health: true,
};

beforeAll(async () => {
  if (Object.keys(permissions).length) {
    await detox.init(config, { launchApp: false });
    await device.launchApp({
      permissions: Object.keys(permissions).reduce((prev, curr) => {
        const value = permissions[curr];
        if (typeof value === 'string') {
          return {
            ...prev,
            [curr]: value,
          };
        } else {
          return {
            ...prev,
            [curr]: value ? 'YES' : 'NO',
          };
        }
      }, {}),
      newInstance: true,
    });
  } else {
    await detox.init(config);
  }
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});
