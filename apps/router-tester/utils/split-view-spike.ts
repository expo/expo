import { useSyncExternalStore } from 'react';

export type SpikeConfig = {
  sidebarHeaderShown?: boolean;
  detailHeaderShown?: boolean;
  headerLargeTitle?: boolean;
  showSecondaryToggleButton: boolean;
  inspector: boolean;
  strategy: 'view' | 'viewNoAsync' | 'childViewController';
};

export const presets: Record<string, SpikeConfig> = {
  baseline: { showSecondaryToggleButton: false, inspector: false, strategy: 'view' },
  case1: {
    sidebarHeaderShown: false,
    detailHeaderShown: false,
    showSecondaryToggleButton: false,
    inspector: false,
    strategy: 'view',
  },
  case2: {
    headerLargeTitle: true,
    showSecondaryToggleButton: false,
    inspector: false,
    strategy: 'view',
  },
  case3: {
    detailHeaderShown: false,
    showSecondaryToggleButton: true,
    inspector: false,
    strategy: 'view',
  },
};

let config: SpikeConfig = presets.baseline;
const listeners = new Set<() => void>();

export function setSpikeConfig(next: Partial<SpikeConfig>) {
  config = { ...config, ...next };
  (globalThis as { __splitHeaderSpikeStrategy?: string }).__splitHeaderSpikeStrategy =
    config.strategy;
  listeners.forEach((listener) => listener());
}

export function useSpikeConfig() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => config
  );
}
