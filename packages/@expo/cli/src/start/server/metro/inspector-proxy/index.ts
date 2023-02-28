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

  return new ExpoInspectorProxy(new MetroInspectorProxy(projectRoot), ExpoInspectorDevice);
}

export function withInspectorProxy(config: MetroConfig, projectRoot: string) {
  if (!env.EXPO_USE_NETWORK_INSPECTOR) {
    return config;
  }

  debug('Adding inspector proxy with Network Inspector support');

  // Turn off the built-in inspector proxy
  return { ...config, server: { ...config.server, runInspectorProxy: false } };
}
