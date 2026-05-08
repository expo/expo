import AppMetrics from 'expo-app-metrics';

export function useObserve() {
  return {
    markInteractive: AppMetrics.markInteractive,
  };
}
