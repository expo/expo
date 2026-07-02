import { optionalRequire } from '../../../navigation/routeBuilder';
import ComponentListScreen, { apiScreensToListElements } from '../../ComponentListScreen';

export const LocationNextScreens = [
  {
    name: 'Request Permissions',
    route: 'Location@Next/permissions',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./PermissionsScreen'));
    },
  },
  {
    name: 'Geofencing with tasks',
    route: 'Location@Next/geofencingTasks',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./GeofencingTasksScreen'));
    },
  },
  {
    name: 'Geofencing with callbacks',
    route: 'Location@Next/geofencingCallbacks',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./GeofencingCallbacksScreen'));
    },
  },
  {
    name: 'Geocoding next',
    route: 'Location@Next/geocoding',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./GeocodingScreen'));
    },
  },
];

export default function LocationNextScreen() {
  const apis = apiScreensToListElements(LocationNextScreens);
  return <ComponentListScreen apis={apis} sort={false} />;
}

LocationNextScreen.navigationOptions = {
  title: 'Location@Next',
};
