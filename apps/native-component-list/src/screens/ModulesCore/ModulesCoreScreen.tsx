import { isRunningInExpoGo } from 'expo';

import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { ListElement } from '../ComponentListScreen';

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
      return optionalRequire(() => require('./ModulesBenchmarksScreen'));
    },
  });
}

export default function ModulesCoreScreen() {
  const apis: ListElement[] = ModulesCoreScreens.map((screen) => {
    return {
      name: screen.name,
      isAvailable: true,
      route: `/apis/${screen.route}`,
    };
  });
  return <ComponentListScreen apis={apis} sort={false} />;
}
