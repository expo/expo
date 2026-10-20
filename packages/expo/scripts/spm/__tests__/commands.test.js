'use strict';

const { configureSpmUpdateCommand, spmUpdateCommand } = require('../commands');

describe('spmUpdateCommand', () => {
  afterEach(() => configureSpmUpdateCommand());

  it("runs React Native's setup script from the app's node_modules by default", () => {
    expect(spmUpdateCommand()).toBe(
      'node node_modules/react-native/scripts/setup-apple-spm.js update'
    );
  });

  it('runs the script of a hoisted react-native, relative to the app root', () => {
    configureSpmUpdateCommand({
      appRoot: '/repo/apps/mobile',
      reactNativeRoot: '/repo/node_modules/react-native',
    });
    expect(spmUpdateCommand()).toBe(
      'node ../../node_modules/react-native/scripts/setup-apple-spm.js update'
    );
  });

  it('returns to the default when configured with nothing', () => {
    configureSpmUpdateCommand({
      appRoot: '/repo/apps/mobile',
      reactNativeRoot: '/repo/node_modules/react-native',
    });
    configureSpmUpdateCommand();
    expect(spmUpdateCommand()).toBe(
      'node node_modules/react-native/scripts/setup-apple-spm.js update'
    );
  });
});

describe('rerunSpmUpdate', () => {
  afterEach(() => configureSpmUpdateCommand());

  it('names the command of the react-native configured after it was loaded', () => {
    const { rerunSpmUpdate } = require('../diagnostics');
    configureSpmUpdateCommand({
      appRoot: '/repo/apps/mobile',
      reactNativeRoot: '/repo/node_modules/react-native',
    });
    expect(rerunSpmUpdate()).toBe(
      'Then run `node ../../node_modules/react-native/scripts/setup-apple-spm.js update` from your app directory again.'
    );
  });
});
