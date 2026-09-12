import type { MetricInput, Session } from 'expo-app-metrics';

/**
 * Records a metric on the session. A rejected write is logged in development instead of
 * propagating: the integrations call this from navigation listeners where nothing awaits it, so a
 * rejection would surface as an unhandled promise rejection in the host app.
 */
export async function recordMetric(
  session: Pick<Session, 'addMetric'>,
  metric: MetricInput
): Promise<void> {
  try {
    await session.addMetric(metric);
  } catch (error) {
    if (__DEV__) {
      console.warn('[expo-observe] Failed to record a navigation metric:', error);
    }
  }
}
