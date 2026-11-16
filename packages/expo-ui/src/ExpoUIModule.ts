import { requireNativeModule } from 'expo';

// Load the native module only here. `jest-expo` loads `mocks/ExpoUI.ts` for a caller whose file
// name contains `ExpoUI`. In an installed package, it cannot read other callers, because their
// source maps point to files that do not exist.
export const ExpoUIModule = requireNativeModule('ExpoUI');
