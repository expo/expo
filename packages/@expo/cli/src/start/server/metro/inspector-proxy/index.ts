import {
  unstable_InspectorProxy as MetroInspectorProxy,
  unstable_Device as Device,
} from '@react-native/dev-middleware';

import { createInspectorDeviceClass } from './device';
import { ExpoInspectorProxy } from './proxy';
import { MetroBundlerDevServer } from '../MetroBundlerDevServer';

export { ExpoInspectorProxy } from './proxy';

const debug = require('debug')('expo:metro:inspector-proxy') as typeof console.log;

export function createInspectorProxy(
  metroBundler: MetroBundlerDevServer,
  projectRoot: string
): ExpoInspectorProxy {
  debug('Expo inspector proxy enabled');

  // The device is slightly more complicated, we need to extend that class
  const ExpoInspectorDevice = createInspectorDeviceClass(metroBundler, Device);

  const inspectorProxy = new ExpoInspectorProxy(
    new MetroInspectorProxy(projectRoot, '', null, {
      enableNewDebugger: true,
      enableOpenDebuggerRedirect: true,
    }),
    ExpoInspectorDevice
  );

  return inspectorProxy;
}
