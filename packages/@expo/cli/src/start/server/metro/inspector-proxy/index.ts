import Device from '@react-native/dev-middleware/dist/inspector-proxy/Device';
import MetroInspectorProxy from '@react-native/dev-middleware/dist/inspector-proxy/InspectorProxy';

import { createInspectorDeviceClass } from './device';
import { ExpoInspectorProxy } from './proxy';
import { MetroBundlerDevServer } from '../MetroBundlerDevServer';

export { ExpoInspectorProxy } from './proxy';

const debug = require('debug')('expo:metro:inspector-proxy') as typeof console.log;

export function createInspectorProxy(metroBundler: MetroBundlerDevServer, projectRoot: string) {
  debug('Expo inspector proxy enabled');

  // The device is slightly more complicated, we need to extend that class
  const ExpoInspectorDevice = createInspectorDeviceClass(metroBundler, Device);

  const inspectorProxy = new ExpoInspectorProxy(
    new MetroInspectorProxy(projectRoot),
    ExpoInspectorDevice
  );

  return inspectorProxy;
}
