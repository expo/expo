import * as SvgModules from 'react-native-svg';
import { ComponentClass } from 'react';

const { Svg } = SvgModules;

for (const key in SvgModules) {
  if (key !== 'default' && key !== 'Svg') {
    Svg[key] = SvgModules[key];
  }
}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

type ExtraAttributes = Omit<typeof SvgModules, 'default' | 'Svg'>;

export default Svg as ComponentClass<SvgModules.SvgProps, any> & ExtraAttributes;
