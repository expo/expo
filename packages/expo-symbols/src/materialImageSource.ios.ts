import type { ImageSourcePropType } from 'react-native';

import { type AndroidSymbol } from './android';

// A noop for iOS, to improve tree shaking.
export async function unstable_getMaterialSymbolSourceAsync(
  symbol: AndroidSymbol | null
): Promise<ImageSourcePropType | null> {
  return null;
}
