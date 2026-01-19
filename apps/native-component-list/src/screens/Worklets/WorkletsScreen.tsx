import { WorkletsTester } from 'worklets-tester';

import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { apiScreensToListElements } from '../ComponentListScreen';

export const WorkletsScreens = [
  {
    name: 'Worklets Initialization',
    route: 'worklets/init',
    getComponent() {
      return optionalRequire(() => require('./WorkletsInitScreen'));
    },
  },
];

if (WorkletsTester.isAvailable()) {
  WorkletsScreens.push({
    name: 'Worklets Tester Screen',
    route: 'worklets/tester-screen',
    getComponent() {
      return optionalRequire(() => require('./WorkletsTesterScreen'));
    },
  });
}

export default function WorkletsScreen() {
  const apis = apiScreensToListElements(WorkletsScreens);
  return <ComponentListScreen apis={apis} sort={false} />;
}
