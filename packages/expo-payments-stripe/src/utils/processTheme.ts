import { processColor } from 'react-native';

import { Theme } from './types';

export type ProcessedTheme = {
  [K in keyof Theme]?: number;
};

export default function processTheme(theme: Theme = {}) {
  return Object.keys(theme).reduce<ProcessedTheme>((result, key) => {
    const value = theme[key];
    if (key.toLowerCase().endsWith('color')) {
      result[key] = processColor(value);
      return result;
    }
    result[key] = value;
    return result;
  }, {});
}
