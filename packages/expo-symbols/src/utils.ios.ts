import type { SymbolViewProps } from './SymbolModule.types';

export function getFont(weight: SymbolViewProps['weight']) {
  // A noop for iOS, to improve tree shaking.
  return null;
}
