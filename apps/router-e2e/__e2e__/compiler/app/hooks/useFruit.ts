import { useBananas } from './useBananas';

export function useFruit() {
  console.log(`${FruitLabelPrefix} Fruits are delicious!`);
}

export const FruitLabelPrefix = 'Fresh';

export { useBananas };
