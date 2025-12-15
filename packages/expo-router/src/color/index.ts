import { PlatformColor, type ColorValue } from 'react-native';

import type {
  AndroidColorAttrSDK1,
  AndroidColorAttrSDK5,
  AndroidColorAttrSDK14,
  AndroidColorAttrSDK21,
  AndroidColorAttrSDK23,
  AndroidColorAttrSDK25,
  AndroidColorAttrSDK26,
} from './android.attr.types';
import type {
  AndroidBaseColorSDK1,
  AndroidBaseColorSDK14,
  AndroidBaseColorSDK31,
  AndroidBaseColorSDK34,
  AndroidBaseColorSDK35,
  AndroidDeprecatedColor,
} from './android.color.types';
import type { AndroidDynamicMaterialColorType } from './android.dynamic.types';
import type { AndroidStaticMaterialColorType } from './android.material.types';
import type { IOSBaseColor } from './ios.types';
import { Material3Color, Material3DynamicColor } from './materialColor';

export * from './android.color.types';
export * from './android.attr.types';
export * from './android.dynamic.types';
export * from './android.material.types';
export * from './ios.types';

export type AndroidBaseColor = AndroidBaseColorSDK1 &
  AndroidBaseColorSDK14 &
  AndroidBaseColorSDK31 &
  AndroidBaseColorSDK34 &
  AndroidBaseColorSDK35 &
  AndroidDeprecatedColor & {
    [key: string]: ColorValue;
  };

export type AndroidBaseColorAttr = AndroidColorAttrSDK1 &
  AndroidColorAttrSDK5 &
  AndroidColorAttrSDK14 &
  AndroidColorAttrSDK21 &
  AndroidColorAttrSDK23 &
  AndroidColorAttrSDK25 &
  AndroidColorAttrSDK26 & {
    [key: string]: ColorValue;
  };

export type AndroidMaterialColor = AndroidStaticMaterialColorType & {
  [key: string]: ColorValue;
};

export type AndroidDynamicMaterialColor = AndroidDynamicMaterialColorType & {
  [key: string]: ColorValue;
};

export interface ColorType {
  ios: IOSBaseColor & {
    [key: string]: ColorValue;
  };
  android: AndroidBaseColor & {
    attr: AndroidBaseColorAttr;
    material: AndroidMaterialColor;
    dynamic: AndroidDynamicMaterialColor;
  };
}

const iosColor = new Proxy({} as ColorType['ios'], {
  get(_, prop: string) {
    // Fork of PlatformColor for RSC support on iOS.
    // https://github.com/facebook/react-native/blob/80e384a8011762f571ff6f47b6674de00aab0485/packages/react-native/Libraries/StyleSheet/PlatformColorValueTypes.ios.js#L25-L28
    return { semantic: [prop] };
  },
});

const androidAttrColor = new Proxy({} as ColorType['android']['attr'], {
  get(_, prop: string) {
    return PlatformColor('?attr/' + prop);
  },
});

const androidMaterialColor = new Proxy({} as ColorType['android']['material'], {
  get(_, prop: string) {
    return Material3Color(prop);
  },
});

const androidDynamicColor = new Proxy({} as ColorType['android']['dynamic'], {
  get(_, prop: string) {
    return Material3DynamicColor(prop);
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
      return PlatformColor('@android:color/' + prop);
    },
  }
);

export const Color: ColorType = {
  get ios() {
    return iosColor;
  },
  get android() {
    return androidColor;
  },
};
