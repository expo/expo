import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { ListElement } from '../ComponentListScreen';

export const MapsScreens = [
  {
    name: 'Basic map',
    route: 'expo-maps/basic',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./MapsBasicScreen'));
    },
  },
  {
    name: 'Camera controlls',
    route: 'expo-maps/camera-controls',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./MapsCameraControlsScreen'));
    },
  },
];

export default function ImageScreen() {
  const apis: ListElement[] = MapsScreens.map((screen) => {
    return {
      name: screen.name,
      isAvailable: true,
      route: `/components/${screen.route}`,
    };
  });
  return <ComponentListScreen apis={apis} sort={false} />;
}
