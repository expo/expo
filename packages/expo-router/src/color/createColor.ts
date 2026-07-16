import { PlatformColor } from 'react-native';

import type { ColorType } from './color';
import { Material3Color, Material3DynamicColor } from './materialColor';

/**
 * Creates a fresh `Color` API object. Colors resolve lazily at property read time;
 * each call returns new object identities at every nesting level, which
 * `useRouterColor` relies on to invalidate memoization when system colors change.
 */
export function createColor(): ColorType {
  const iosColor = new Proxy({} as ColorType['ios'], {
    get(_, prop: string) {
      if (process.env.EXPO_OS === 'ios') {
        return PlatformColor(prop);
      }
      return null;
    },
  });

  const androidAttrColor = new Proxy({} as ColorType['android']['attr'], {
    get(_, prop: string) {
      if (process.env.EXPO_OS === 'android') {
        return PlatformColor('?attr/' + prop);
      }
      return null;
    },
  });

  const androidMaterialColor = new Proxy({} as ColorType['android']['material'], {
    get(_, prop: string) {
      if (process.env.EXPO_OS === 'android') {
        return Material3Color(prop);
      }
      return null;
    },
  });

  const androidDynamicColor = new Proxy({} as ColorType['android']['dynamic'], {
    get(_, prop: string) {
      if (process.env.EXPO_OS === 'android') {
        return Material3DynamicColor(prop);
      }
      return null;
    },
  });

  const androidColor = new Proxy(
    {
      get attr() {
        return androidAttrColor;
      },
      get material() {
        return androidMaterialColor;
      },
      get dynamic() {
        return androidDynamicColor;
      },
    } as ColorType['android'],
    {
      get(target, prop: string) {
        if (prop in target) {
          return target[prop];
        }
        if (process.env.EXPO_OS === 'android') {
          return PlatformColor('@android:color/' + prop);
        }
        return null;
      },
    }
  );

  return {
    get ios() {
      return iosColor;
    },
    get android() {
      return androidColor;
    },
  };
}
