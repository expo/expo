import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

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
  {
    name: 'Runtime teardown',
    route: 'modulescore/runtime-teardown',
    getComponent() {
      return optionalRequire(() => require('./RuntimeTeardownScreen'));
    },
  },
];

if (Platform.OS === 'android') {
  ModulesCoreScreens.push({
    name: 'Expo modules v2',
    route: 'modulescore/expo-modules-v2',
    getComponent() {
      return optionalRequire(() => require('./ExpoModulesV2Screen'));
    },
  });
}

if (!isRunningInExpoGo()) {
  ModulesCoreScreens.push({
    name: 'Benchmarks',
    route: 'modulescore/benchmarks',
    getComponent() {
      return optionalRequire(() => require('./Benchmarks/ModulesBenchmarksScreen'));
    },
  });
  ModulesCoreScreens.push({
    name: 'Jest Mock Generator',
    route: 'modulescore/jest-mock-generator',
    getComponent() {
      return optionalRequire(() => require('./JestMockGeneratorScreen'));
    },
  });
}

export default function ModulesCoreScreen() {
  const apis = apiScreensToListElements(ModulesCoreScreens);
  return <ComponentListScreen apis={apis} sort={false} />;
}
