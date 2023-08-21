import { Terminal } from 'metro-core';
import path from 'path';

import { stripAnsi } from '../../../../utils/ansi';
import logToConsole from '../logToConsole';

jest.unmock('resolve-from');

beforeEach(() => {
  delete process.env.EXPO_DEV_SERVER_ORIGIN;
});

afterAll(() => {
  delete process.env.EXPO_DEV_SERVER_ORIGIN;
});

jest.mock('../metroErrorInterface', () => ({
  getMetroStackAsLogString: jest.requireActual('../metroErrorInterface').getMetroStackAsLogString,
  getSymbolicatedMetroStackAsync: jest.fn(async () => ({
    stack: [
      {
        arguments: [],
        column: 2,
        file: '/my-app/node_modules/@react-navigation/native-stack/src/views/HeaderConfig.tsx',
        lineNumber: 35,
        methodName: 'HeaderConfig',
        collapse: false,
      },
      {
        arguments: [],
        column: 5,
        file: '/my-app/node_modules/react-native/Libraries/Animated/createAnimatedComponent.js',
        lineNumber: 39,
        methodName: 'React.forwardRef$argument_0',
        collapse: false,
      },
      {
        arguments: [],
        column: 10,
        file: '/my-app/node_modules/expo-router/src/ExpoRoot.tsx',
        lineNumber: 55,
        methodName: 'ExpoRoot',
        collapse: false,
      },
      {
        arguments: [],
        column: 26,
        file: '/my-app/node_modules/expo/build/launch/withDevTools.js',
        lineNumber: 31,
        methodName: 'WithDevTools',
        collapse: false,
      },
      {
        arguments: [],
        column: 0,
        file: '/my-app/node_modules/@expo/metro-runtime/build/error-overlay/toast/ErrorToastContainer.js',
        lineNumber: 9,
        methodName: 'ErrorToastContainer',
        collapse: true,
      },
      {
        arguments: [],
        column: 6,
        file: '/my-app/node_modules/react-native/Libraries/Components/View/View.js',
        lineNumber: 36,
        methodName: 'React.forwardRef$argument_0',
        collapse: false,
      },
      {
        arguments: [],
        column: 6,
        file: '/my-app/node_modules/react-native/Libraries/Components/View/View.js',
        lineNumber: 36,
        methodName: 'React.forwardRef$argument_0',
        collapse: false,
      },
      {
        arguments: [],
        column: 18,
        file: '/my-app/node_modules/react-native/Libraries/ReactNative/AppContainer.js',
        lineNumber: 40,
        methodName: 'AppContainer',
        collapse: false,
      },
      {
        arguments: [],
        column: 79,
        file: '/my-app/node_modules/react-native/Libraries/ReactNative/getCachedComponentWithDebugName.js',
        lineNumber: 28,
        methodName: 'getCachedComponentWithDisplayName',
        collapse: false,
      },
    ],
    codeFrame: {
      content:
        '\x1B[0m \x1B[90m 33 |\x1B[39m   headerHeight\x1B[33m,\x1B[39m\x1B[0m\n' +
        '\x1B[0m \x1B[90m 34 |\x1B[39m   headerBackImageSource\x1B[33m,\x1B[39m\x1B[0m\n' +
        '\x1B[0m\x1B[31m\x1B[1m>\x1B[22m\x1B[39m\x1B[90m 35 |\x1B[39m   headerBackButtonMenuEnabled\x1B[33m,\x1B[39m\x1B[0m\n' +
        '\x1B[0m \x1B[90m    |\x1B[39m   \x1B[31m\x1B[1m^\x1B[22m\x1B[39m\x1B[0m\n' +
        '\x1B[0m \x1B[90m 36 |\x1B[39m   headerBackTitle\x1B[33m,\x1B[39m\x1B[0m\n' +
        '\x1B[0m \x1B[90m 37 |\x1B[39m   headerBackTitleStyle\x1B[33m,\x1B[39m\x1B[0m\n' +
        '\x1B[0m \x1B[90m 38 |\x1B[39m   headerBackTitleVisible \x1B[33m=\x1B[39m \x1B[36mtrue\x1B[39m\x1B[33m,\x1B[39m\x1B[0m',
      location: { row: 35, column: 2 },
      fileName: '/my-app/node_modules/@react-navigation/native-stack/src/views/HeaderConfig.tsx',
    },
  })),
}));

const projectRoot = path.join(__dirname, '../../../../../../../../apps/router-e2e');

function createTerminal() {
  return {
    log: jest.fn(),
    // log: jest.fn(console.log),
  } as unknown as Terminal;
}

it(`symbolicates warning stack traces`, async () => {
  const terminal = createTerminal();
  await logToConsole(
    projectRoot,
    terminal,
    'warn',
    'BRIDGE',
    ...[
      'You started loading the font "Inter_500Medium", but used it before it finished loading. You need to wait for Font.loadAsync to complete before using the font.',
      '\n' +
        '    at HeaderConfig (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:141762:28)\n' +
        '    at RNSScreen\n' +
        '    at anonymous (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:98835:62)\n' +
        '    at Suspender (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:141371:22)\n' +
        '    at Suspense\n' +
        '    at Freeze (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:141390:23)\n' +
        '    at AppContainer (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:40253:36)\n' +
        '    at main(RootComponent) (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:121649:28)',
    ]
  );

  const res = terminal.log.mock.calls[0];
  expect(stripAnsi(res[1])).toMatchSnapshot();
});

it(`symbolicates console.error stack traces`, async () => {
  const terminal = createTerminal();
  await logToConsole(
    projectRoot,
    terminal,
    'error',
    'BRIDGE',
    ...[
      'hey',
      '\n' +
        '    at InnerLayout (http://172.20.1.239:8081/src/app/_layout.bundle//&platform=ios&hot=false&lazy=true&dev=true&minify=false&modulesOnly=true&runModule=false&shallow=true:102:48)\n' +
        '    at main(RootComponent) (http://172.20.1.239:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true:121649:28)',
    ]
  );

  const res = terminal.log.mock.calls[0];
  expect(stripAnsi(res[1])).toMatchSnapshot();
});

it(`doesn't symbolicate thrown errors`, async () => {
  const terminal = createTerminal();
  await logToConsole(
    projectRoot,
    terminal,
    'error',
    'BRIDGE',
    ...[
      'Error: thrown-in-tree\n' +
        '\n' +
        'This error is located at:\n' +
        '    in InnerLayout (created by Layout)\n' +
        '    in AnimatedSplashScreen (created by Layout)\n' +
        '    in Layout\n' +
        '    in Try\n' +
        '    in Unknown\n' +
        '    in RCTView (created by View)\n' +
        '    in View (created by AppContainer)\n' +
        '    in AppContainer\n' +
        '    in main(RootComponent), js engine: hermes',
    ]
  );

  const res = terminal.log.mock.calls[0].map(stripAnsi);
  expect(typeof res[0]).toBe('string');
  expect(typeof res[1]).toBe('string');
});
