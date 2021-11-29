import { NumberProp } from './types';

export default function extractOpacity(opacity: NumberProp | void) {
  const value = +opacity;
  return isNaN(value) ? 1 : value;
}
