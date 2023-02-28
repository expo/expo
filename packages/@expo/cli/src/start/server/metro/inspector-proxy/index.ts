import { MetroConfig } from '@expo/metro-config';

import { env } from '../../../../utils/env';
import {
  importMetroInspectorDeviceFromProject,
  importMetroInspectorProxyFromProject,
} from '../resolveFromProject';
import { createInspectorDeviceClass } from './device';
import { ExpoInspectorProxy } from './proxy';

const debug = require('debug')('expo:metro:inspector-proxy') as typeof console.log;

export function createInspectorProxy(projectRoot: string) {
  // Import the installed `metro-inspector-proxy` from the project
  // We use these base classes to extend functionality
  const { InspectorProxy: MetroInspectorProxy } = importMetroInspectorProxyFromProject(projectRoot);
  // The device is slightly more complicated, we need to extend that class
  const ExpoInspectorDevice = createInspectorDeviceClass(
    importMetroInspectorDeviceFromProject(projectRoot)
  );

  const inspectorProxy = new ExpoInspectorProxy(
    new MetroInspectorProxy(projectRoot),
    ExpoInspectorDevice
  );

  // TODO(cedric): Remove this if we can
  // Temporarily add the debugging messages, to keep the socket alive
  setInterval(() => {
    inspectorProxy.devices.forEach((device) => {
      const socket = device?._debuggerConnection?.socket;
      const payload = {
        method: 'Console.messageAdded',
        params: {
          message: {
            source: 'javascript',
            level: 'info',
            text: 'ooxx text',
          },
        },
      };
      socket?.send(JSON.stringify(payload));
    });
  }, 3000);

  return inspectorProxy;
}

export function withInspectorProxy(config: MetroConfig, projectRoot: string) {
  if (!env.EXPO_USE_CUSTOM_INSPECTOR_PROXY) {
    return config;
  }

  debug('Adding inspector proxy with Network Inspector support');

  // Turn off the built-in inspector proxy
  return { ...config, server: { ...config.server, runInspectorProxy: false } };
}
