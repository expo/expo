import { Platform } from 'react-native';

import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { ListElement } from '../ComponentListScreen';

export const MapsScreens = Platform.select({
  android: [
    {
      name: 'Basic map',
      route: 'expo-maps/basic',
      options: {},
      getComponent() {
        return optionalRequire(() => require('./google/MapsBasicScreen'));
      },
    },
    {
      name: 'Camera controls',
      route: 'expo-maps/camera-controls',
      options: {},
      getComponent() {
        return optionalRequire(() => require('./google/MapsCameraControlsScreen'));
      },
    },
    {
      name: 'Maps properties',
      route: 'expo-maps/properties',
      options: {},
      getComponent() {
        return optionalRequire(() => require('./google/MapsPropertiesScreen'));
      },
    },
    {
      name: 'Maps UI settings',
      route: 'expo-maps/ui-settings',
      options: {},
      getComponent() {
        return optionalRequire(() => require('./google/MapsUISettingsScreen'));
      },
    },
    {
      name: 'Markers',
      route: 'expo-maps/markers',
      options: {},
      getComponent() {
        return optionalRequire(() => require('./google/MapsMarkerScreen'));
      },
    },
    {
      name: 'Maps events',
      route: 'expo-maps/events',
      options: {},
      getComponent() {
        return optionalRequire(() => require('./google/MapsEventsScreen'));
      },
    },
    {
      name: 'Marker with custom image',
      route: 'expo-maps/image-ref',
      options: {},
      getComponent() {
        return optionalRequire(() => require('./google/MapsImageRefIntegrationScreen'));
      },
    },
  ],
  default: [],
});

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
