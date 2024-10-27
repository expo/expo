import { useMemo } from 'react';

function SIDE_EFFECT_MAY_THROW() {}

// NOTE(EvanBacon): React compiler throws:
// Cannot read properties of undefined (reading 'preds')
export function useSideEffectMayThrow() {
  return useMemo(() => {
    try {
      SIDE_EFFECT_MAY_THROW();
      return true;
    } catch {
      return false;
    }
  }, []);
}
