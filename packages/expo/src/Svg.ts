import * as SvgModules from 'react-native-svg';
import { ComponentClass } from 'react';

import deprecatedModule from './deprecatedModule';

const { Svg } = SvgModules;

for (const key in SvgModules) {
  if (key !== 'default' && key !== 'Svg') {
    Object.defineProperty(Svg, key, {
      enumerable: true,
      get() {
        deprecatedModule(
          `Svg.${key} -> import { ${key} } from 'react-native-svg'`,
          'react-native-svg'
        );
        return SvgModules[key];
      },
    });
    Svg[key] = SvgModules[key];
  }
}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

type ExtraAttributes = Omit<typeof SvgModules, 'default' | 'Svg'>;

export default Svg as ComponentClass<SvgModules.SvgProps, any> & ExtraAttributes;
