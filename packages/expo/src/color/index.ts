import { PlatformColor, type ColorValue } from 'react-native';

import type { AndroidBaseColorAttr, AndroidBaseColorName } from './android.types';
import type { IOSColorName } from './ios.types';

export { AndroidBaseColorAttr, AndroidBaseColorName, IOSColorName };

type ColorGroup<PredefinedValues extends string> = {
  [key in PredefinedValues | (string & {})]: ColorValue;
};

export interface ColorType {
  ios: ColorGroup<IOSColorName>;
  android: ColorGroup<AndroidBaseColorName> & {
    attr: ColorGroup<AndroidBaseColorAttr>;
  };
}

const iosColor = new Proxy({} as ColorGroup<IOSColorName>, {
  get(_, prop: string) {
    return PlatformColor(prop);
  },
});

const androidAttrColor = new Proxy({} as ColorGroup<AndroidBaseColorAttr>, {
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
