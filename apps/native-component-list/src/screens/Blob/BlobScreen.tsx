import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { ListElement } from '../ComponentListScreen';

export const BlobScreens = [
  {
    name: 'Blob Constructor',
    route: 'expo-blob/constructor',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./BlobConstructorScreen'));
    },
  },
  {
    name: 'Blob Slice',
    route: 'expo-blob/slice',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./BlobSliceScreen'));
    },
  },
  {
    name: 'Blob Stream',
    route: 'expo-blob/stream',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./BlobStreamScreen'));
    },
  },
  {
    name: 'Blob Text',
    route: 'expo-blob/text',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./BlobTextScreen'));
    },
  },
  {
    name: 'Blob Array Buffer',
    route: 'expo-blob/array-buffer',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./BlobArrayBufferScreen'));
    },
  },
  {
    name: 'Blob Bytes',
    route: 'expo-blob/bytes',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./BlobBytesScreen'));
    },
  },
  {
    name: 'Blob Performance Test',
    route: 'expo-blob/performance',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./BlobPerformanceTestScreen'));
    },
  },
];

export default function BlobScreen() {
  const apis: ListElement[] = BlobScreens.map((screen) => {
    return {
      name: screen.name,
      isAvailable: true,
      route: `/apis/${screen.route}`,
    };
  });
  return <ComponentListScreen apis={apis} sort={false} />;
}
