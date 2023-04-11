import { Log } from '../../../../log';
import { MetroBundlerDevServer } from '../MetroBundlerDevServer';
import {
  importMetroInspectorDeviceFromProject,
  importMetroInspectorProxyFromProject,
} from '../resolveFromProject';
import { createInspectorDeviceClass } from './device';
import { ExpoInspectorProxy } from './proxy';

export { ExpoInspectorProxy } from './proxy';

export function createInspectorProxy(metroBundler: MetroBundlerDevServer, projectRoot: string) {
  Log.warn(
    'Experimental inspector proxy enabled. This early version requires newer Metro functionality, which is only available in SDK 49+.'
  );

  // Import the installed `metro-inspector-proxy` from the project
  // We use these base classes to extend functionality
  const { InspectorProxy: MetroInspectorProxy } = importMetroInspectorProxyFromProject(projectRoot);
  // The device is slightly more complicated, we need to extend that class
  const ExpoInspectorDevice = createInspectorDeviceClass(
    metroBundler,
    importMetroInspectorDeviceFromProject(projectRoot)
  );

  const inspectorProxy = new ExpoInspectorProxy(
    new MetroInspectorProxy(projectRoot),
    ExpoInspectorDevice
  );

  return inspectorProxy;
}
