import type { MetroInspectorProxyApp } from '../../JsInspector';

export const METRO_INSPECTOR_RESPONSE_FIXTURE: MetroInspectorProxyApp[] = [
  {
    id: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-3',
    appId: 'io.expo.test.devclient',
    description: 'React Native Bridgeless [C++ connection]',
    title: 'io.expo.test.devclient (sdk_gphone64_arm64)',
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
    id: 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY-1',
    appId: 'io.expo.test.hermes',
    description: 'React Native Bridgeless [C++ connection]',
    title: 'io.expo.test.devclient (sdk_gphone64_arm64)',
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
];
