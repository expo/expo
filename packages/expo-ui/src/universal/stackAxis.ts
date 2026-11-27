import { createContext, useContext } from 'react';

import type { UniversalStyle } from './types';

export type StackAxis = 'horizontal' | 'vertical';

/**
 * Main axis of the nearest universal `Row` or `Column` on web.
 * A plain view lays its children out vertically, so that is the default.
 */
export const StackAxisContext = createContext<StackAxis>('vertical');

/** The size `style` sets on the parent's cross axis, if any. */
export function useCrossAxisSize(style: UniversalStyle | undefined) {
  const parentAxis = useContext(StackAxisContext);
  return parentAxis === 'horizontal' ? style?.height : style?.width;
}
