import type { ObserveConfig } from '../types';
import type { BundleDefaults } from './types';

// The native module dispatches on Android and iOS, so the web dispatcher is a no-op there.
export function setDispatchConfig(_config: ObserveConfig): void {}

export function setDispatchBundleDefaults(_defaults: BundleDefaults): void {}

export async function dispatch(): Promise<void> {}
