import { createContext, use } from 'react';

const initialOwnership: Record<string, unknown> = {};

export const NativeStackSpikeContext = createContext({
  integrated: false,
  revision: 0,
  titleVersion: 0,
  hidden: false,
  gestures: true,
  largeTitle: true,
  ownership: initialOwnership,
  enableIntegration: () => {},
  inspect: () => {},
  changeTitle: () => {},
  showPrimary: () => {},
  report: (_report: Record<string, unknown>) => {},
});

export const useNativeStackSpike = () => use(NativeStackSpikeContext);
