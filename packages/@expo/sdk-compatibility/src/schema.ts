import semver from 'semver';

import type { SdkCompatibilityData } from './types';
import { createSdkCompatibilityDataValidator } from './validation';

export const validateSdkCompatibilityData = createSdkCompatibilityDataValidator(semver);

export function assertSdkCompatibilityData(value: unknown): asserts value is SdkCompatibilityData {
  const errors = validateSdkCompatibilityData(value);
  if (errors.length > 0) {
    throw new Error(`Invalid Expo SDK compatibility data:\n- ${errors.join('\n- ')}`);
  }
}
