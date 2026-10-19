import type { DefinedNativePlugin } from 'noxcturnal';

import type { Noxcturnal } from '../noxcturnal-transformer';
import { createEligibilityVisitors } from './module-eligibility';

export function createNativeEsmEligibilityPlugin(
  nox: Noxcturnal,
  isHermesV1: boolean
): DefinedNativePlugin {
  return nox.defineNativePlugin({
    name: 'expo-metro-eligibility',
    visitors: createEligibilityVisitors(nox, isHermesV1),
  });
}
