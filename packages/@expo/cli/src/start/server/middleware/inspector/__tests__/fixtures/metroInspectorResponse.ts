import type { MetroInspectorProxyApp } from '../../JsInspector';

export const METRO_INSPECTOR_RESPONSE_FIXTURE: MetroInspectorProxyApp[] = [
  {
    id: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-3',
    description: 'io.expo.test.devclient',
    title: 'Hermes React Native',
    devtoolsFrontendUrl:
      'chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=%5B%3A%3A%5D%3A8081%2Finspector%2Fdebug%3Fdevice%3D0%26page%3D3',
    type: 'node',
    webSocketDebuggerUrl: 'ws://[::]:8081/inspector/debug?device=0&page=3',
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
    devtoolsFrontendUrl:
      'chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=%5B%3A%3A%5D%3A8081%2Finspector%2Fdebug%3Fdevice%3D0%26page%3D-1',
    type: 'node',
    webSocketDebuggerUrl: 'ws://[::]:8081/inspector/debug?device=0&page=-1',
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
    devtoolsFrontendUrl:
      'chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=%5B%3A%3A%5D%3A8081%2Finspector%2Fdebug%3Fdevice%3D1%26page%3D1',
    type: 'node',
    webSocketDebuggerUrl: 'ws://[::]:8081/inspector/debug?device=1&page=1',
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
    devtoolsFrontendUrl:
      'chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=%5B%3A%3A%5D%3A8081%2Finspector%2Fdebug%3Fdevice%3D1%26page%3D-1',
    type: 'node',
    webSocketDebuggerUrl: 'ws://[::]:8081/inspector/debug?device=1&page=-1',
    deviceName: 'iPhone 15 Pro',
    reactNative: {
      logicalDeviceId: 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
      capabilities: {},
    },
  },
];
