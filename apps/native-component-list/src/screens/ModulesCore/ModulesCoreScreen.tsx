import { isRunningInExpoGo, Platform } from 'expo';

import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { apiScreensToListElements } from '../ComponentListScreen';

export const ModulesCoreScreens = [
  {
    name: 'Core module',
    route: 'modulescore/core-module',
    getComponent() {
      return optionalRequire(() => require('./CoreModuleScreen'));
    },
  },
  {
    name: 'Expo modules',
    route: 'modulescore/expo-modules',
    getComponent() {
      return optionalRequire(() => require('./ExpoModulesScreen'));
    },
  },
];

if (!isRunningInExpoGo()) {
  ModulesCoreScreens.push({
    name: 'Benchmarks',
    route: 'modulescore/benchmarks',
    getComponent() {
      return optionalRequire(() => require('./Benchmarks/ModulesBenchmarksScreen'));
    },
  });
  // The view-props decoding benchmark is iOS-only (the native `BenchmarkView` and the
  // view-props counters aren't implemented on Android).
  if (Platform.OS === 'ios') {
    ModulesCoreScreens.push({
      name: 'View props decoding benchmark',
      route: 'modulescore/view-props-benchmark',
      getComponent() {
        return optionalRequire(() => require('./ViewPropsBenchmarkScreen'));
      },
    });
  }
}

export default function ModulesCoreScreen() {
  const apis = apiScreensToListElements(ModulesCoreScreens);
  return <ComponentListScreen apis={apis} sort={false} />;
}
