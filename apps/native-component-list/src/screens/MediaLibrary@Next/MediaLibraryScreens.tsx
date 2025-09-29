import { Platform } from 'react-native';
import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { ListElement } from '../ComponentListScreen';

export const MediaLibraryScreens = [
  {
    name: 'Asset',
    route: 'medialibrary@next/asset',
    getComponent() {
      return optionalRequire(() => require('./AssetScreen'));
    },
  },
  {
    name: 'Add Asset to Album',
    route: 'medialibrary@next/add-asset-to-album',
    getComponent() {
      return optionalRequire(() => require('./AddAssetToAlbumScreen'));
    },
  },
  {
    name: 'Sort',
    route: 'medialibrary@next/sort',
    getComponent() {
      return optionalRequire(() => require('./SortScreen'));
    },
  },
];

if (Platform.OS === 'android' && Platform.Version >= 33) {
  MediaLibraryScreens.push({
    name: 'Granular Permissions',
    route: 'medialibrary@next/granular-permissions',
    getComponent() {
      return optionalRequire(() => require('./GranularPermissionsScreen'));
    },
  });
}

export default function MediaLibraryScreen() {
  const apis: ListElement[] = MediaLibraryScreens.map((screen) => {
    return {
      name: screen.name,
      isAvailable: true,
      route: `/apis/${screen.route}`,
    };
  });

  return <ComponentListScreen apis={apis} sort={false} />;
}
