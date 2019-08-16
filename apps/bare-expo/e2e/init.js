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

beforeAll(async () => {
  await detox.init(config, { launchApp: false });
  await device.launchApp({
    permissions: {
      calendar: 'YES',
      camera: 'YES',
      contacts: 'YES',
      faceid: 'YES',
      // (iOS 12.0 and above)
      health: 'YES',
      homekit: 'YES',
      location: 'always', // inuse, never, unset
      medialibrary: 'YES',
      microphone: 'YES',
      motion: 'YES',
      notifications: 'YES',
      photos: 'YES',
      reminders: 'YES',
      siri: 'YES',
      speech: 'YES',
    },
    newInstance: true,
  });
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});
