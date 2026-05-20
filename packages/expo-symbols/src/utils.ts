import type { SymbolViewProps } from './SymbolModule.types';
import regular from './android/weights/regular';

export function getFont(weight: SymbolViewProps['weight']) {
  const platformWeight = typeof weight === 'object' ? weight.android : null;
  if (!platformWeight) return regular;

  return platformWeight;
}
