import { isRunningInExpoGo } from 'expo';

const noopObserve = () => ({ markInteractive: () => {} });

// expo-observe's native module is excluded from Expo Go, and importing the
// package crashes at bundle evaluation there. Only require it in
// development builds; Expo Go gets a no-op.
export const useObserve: () => { markInteractive: () => void } = isRunningInExpoGo()
  ? noopObserve
  : require('expo-observe').useObserve;
