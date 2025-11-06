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
import type { IOSBaseColor } from './ios.types';

export * from './android.color.types';
export * from './android.attr.types';
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

export interface ColorType {
  ios: IOSBaseColor & {
    [key: string]: ColorValue;
  };
  android: AndroidBaseColor & {
    attr: AndroidBaseColorAttr;
  };
}

const iosColor = new Proxy({} as ColorType['ios'], {
  get(_, prop: string) {
    return PlatformColor(prop);
  },
});

const androidAttrColor = new Proxy({} as ColorType['android']['attr'], {
  get(_, prop: string) {
    return PlatformColor('?attr/' + prop);
  },
});

const androidColor = new Proxy(
  {
    get attr() {
      return androidAttrColor;
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

Color.android.primary_text_dark;
