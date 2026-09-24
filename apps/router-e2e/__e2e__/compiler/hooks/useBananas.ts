import { FruitLabelPrefix } from './useFruit';

export function useBananas() {
  if (!FruitLabelPrefix) {
    throw new Error('Prefix is not defined.');
  }
  console.log(`${FruitLabelPrefix} Bananas are great!`);
}
