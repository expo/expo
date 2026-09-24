/* eslint-disable import/export */
// To allow overlapping exports.

import { useBananas } from './useBananas';

export * from './useApples';

export function useFruit() {
  return `${FruitLabelPrefix} Fruits are delicious!`;
}

export const FruitLabelPrefix = 'Fresh';

export { useBananas };
