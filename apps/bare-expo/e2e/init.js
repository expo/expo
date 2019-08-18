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

beforeEach(async function beforeEach() {
  const retry = this.currentTest.currentRetry();

  if (retry > 0) {
    if (retry === 1) {
      console.log();
      console.warn(`💔 failed:`);
      console.warn(`️  👉  ${this.currentTest.title}`);
    }

    if (retry > 1) {
      console.warn(`   ✌️ Retry #${retry - 1} failed...`);
    }

    console.warn(`️   👉 Retrying in ${1 * retry} seconds ... (${retry})`);
    await Utils.sleep(2000 * retry);
  }
});

afterAll(async () => {
  console.log(` 💙 Tests Complete 💙 `);
  await adapter.afterAll();
  await detox.cleanup();
});
