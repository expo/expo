import type { MetroInspectorProxyApp } from '../../JsInspector';

export const METRO_INSPECTOR_RESPONSE_FIXTURE: MetroInspectorProxyApp[] = [
  {
    description: 'io.expo.test.devclient',
    devtoolsFrontendUrl:
      'chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=%5B%3A%3A%5D%3A8081%2Finspector%2Fdebug%3Fdevice%3D0%26page%3D3',
    faviconUrl: 'https://reactjs.org/favicon.ico',
    id: '0-3',
    title: 'Hermes React Native',
    type: 'node',
    vm: 'Hermes',
    webSocketDebuggerUrl: 'ws://[::]:8081/inspector/debug?device=0&page=3',
  },
  {
    description: "don't use",
    devtoolsFrontendUrl:
      'chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=%5B%3A%3A%5D%3A8081%2Finspector%2Fdebug%3Fdevice%3D0%26page%3D-1',
    faviconUrl: 'https://reactjs.org/favicon.ico',
    id: '0--1',
    title: 'React Native Experimental (Improved Chrome Reloads)',
    type: 'node',
    vm: "don't use",
    webSocketDebuggerUrl: 'ws://[::]:8081/inspector/debug?device=0&page=-1',
  },
  {
    description: 'io.expo.test.hermes',
    devtoolsFrontendUrl:
      'chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=%5B%3A%3A%5D%3A8081%2Finspector%2Fdebug%3Fdevice%3D1%26page%3D1',
    faviconUrl: 'https://reactjs.org/favicon.ico',
    id: '1-1',
    title: 'Hermes React Native',
    type: 'node',
    vm: 'Hermes',
    webSocketDebuggerUrl: 'ws://[::]:8081/inspector/debug?device=1&page=1',
  },
  {
    description: "don't use",
    devtoolsFrontendUrl:
      'chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=%5B%3A%3A%5D%3A8081%2Finspector%2Fdebug%3Fdevice%3D1%26page%3D-1',
    faviconUrl: 'https://reactjs.org/favicon.ico',
    id: '1--1',
    title: 'React Native Experimental (Improved Chrome Reloads)',
    type: 'node',
    vm: "don't use",
    webSocketDebuggerUrl: 'ws://[::]:8081/inspector/debug?device=1&page=-1',
  },
];

export const METRO_INSPECTOR_RESPONSE_FIXTURE_RN_74: MetroInspectorProxyApp[] = [
  {
    id: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-3',
    description: 'io.expo.test.devclient',
    title: 'Hermes React Native',
    faviconUrl: 'https://reactjs.org/favicon.ico',
    devtoolsFrontendUrl:
      'chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=%5B%3A%3A%5D%3A8081%2Finspector%2Fdebug%3Fdevice%3D0%26page%3D3',
    type: 'node',
    webSocketDebuggerUrl: 'ws://[::]:8081/inspector/debug?device=0&page=3',
    vm: 'Hermes',
    deviceName: 'iPhone 15 Pro',
    reactNative: {
      logicalDeviceId: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      capabilities: {
        nativePageReloads: true,
      },
    },
  },
  {
    id: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX--1',
    description: "don't use",
    title: 'React Native Experimental (Improved Chrome Reloads)',
    faviconUrl: 'https://reactjs.org/favicon.ico',
    devtoolsFrontendUrl:
      'chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=%5B%3A%3A%5D%3A8081%2Finspector%2Fdebug%3Fdevice%3D0%26page%3D-1',
    type: 'node',
    webSocketDebuggerUrl: 'ws://[::]:8081/inspector/debug?device=0&page=-1',
    vm: "don't use",
    deviceName: 'iPhone 15 Pro',
    reactNative: {
      logicalDeviceId: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      capabilities: {},
    },
  },
  {
    id: 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY-1',
    description: 'io.expo.test.hermes',
    title: 'Hermes React Native',
    faviconUrl: 'https://reactjs.org/favicon.ico',
    devtoolsFrontendUrl:
      'chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=%5B%3A%3A%5D%3A8081%2Finspector%2Fdebug%3Fdevice%3D1%26page%3D1',
    type: 'node',
    webSocketDebuggerUrl: 'ws://[::]:8081/inspector/debug?device=1&page=1',
    vm: 'Hermes',
    deviceName: 'iPhone 15 Pro',
    reactNative: {
      logicalDeviceId: 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
      capabilities: {
        nativePageReloads: true,
      },
    },
  },
  {
    id: 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY--1',
    description: "don't use",
    title: 'React Native Experimental (Improved Chrome Reloads)',
    faviconUrl: 'https://reactjs.org/favicon.ico',
    devtoolsFrontendUrl:
      'chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=%5B%3A%3A%5D%3A8081%2Finspector%2Fdebug%3Fdevice%3D1%26page%3D-1',
    type: 'node',
    webSocketDebuggerUrl: 'ws://[::]:8081/inspector/debug?device=1&page=-1',
    vm: "don't use",
    deviceName: 'iPhone 15 Pro',
    reactNative: {
      logicalDeviceId: 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
      capabilities: {},
    },
  },
];
