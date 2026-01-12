import { View, Text } from 'react-native';
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

export default function WorkletsScreen() {
  const apis = apiScreensToListElements(WorkletsScreens);
  return <ComponentListScreen apis={apis} sort={false} />;
}
