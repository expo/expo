import type { ObserveModule } from './types';

// Only iOS apps have a privacy manifest, so other platforms have nothing to check.
export function warnIfUserContentEntryMissing(native: ObserveModule): void {}
