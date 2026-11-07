import type { Session } from 'expo-app-metrics';

/**
 * Records a navigation metric without rejecting when the session cannot store it. Navigation
 * listeners run outside any caller that could handle a rejection, so a failed write would
 * otherwise become an unhandled promise rejection on every navigation.
 */
export async function recordNavigationMetric(
  session: Pick<Session, 'addMetric'>,
  metric: Parameters<Session['addMetric']>[0]
): Promise<void> {
  try {
    await session.addMetric(metric);
  } catch (error) {
    if (__DEV__) {
      console.warn(
        `[expo-observe] Failed to record the "${metric.name}" navigation metric:`,
        error
      );
    }
  }
}
