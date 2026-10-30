'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

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

  it('runs the script of a hoisted react-native when the app root is reached through a symlink', () => {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-commands-')));
    try {
      const reactNativeRoot = path.join(root, 'deep', 'repo', 'node_modules', 'react-native');
      fs.mkdirSync(reactNativeRoot, { recursive: true });
      fs.mkdirSync(path.join(root, 'deep', 'repo', 'apps', 'mobile'), { recursive: true });
      fs.symlinkSync(path.join(root, 'deep', 'repo'), path.join(root, 'link'));

      configureSpmUpdateCommand({
        appRoot: path.join(root, 'link', 'apps', 'mobile'),
        reactNativeRoot,
      });
      expect(spmUpdateCommand()).toBe(
        'node ../../node_modules/react-native/scripts/setup-apple-spm.js update'
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('keeps the name of a react-native that is itself a symlink, as pnpm installs it', () => {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-commands-')));
    try {
      const store = path.join(root, 'node_modules', '.pnpm', 'react-native@0.88.0', 'node_modules');
      fs.mkdirSync(path.join(store, 'react-native'), { recursive: true });
      fs.symlinkSync(
        path.join(store, 'react-native'),
        path.join(root, 'node_modules', 'react-native')
      );

      configureSpmUpdateCommand({
        appRoot: root,
        reactNativeRoot: path.join(root, 'node_modules', 'react-native'),
      });
      expect(spmUpdateCommand()).toBe(
        'node node_modules/react-native/scripts/setup-apple-spm.js update'
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
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
