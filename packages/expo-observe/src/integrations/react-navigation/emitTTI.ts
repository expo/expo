import AppMetrics from 'expo-app-metrics';

export function emitTTI(args: {
  sessionId: string;
  timestamp: string;
  routeName: string | undefined;
  value: number;
  routeParams: object;
}): Promise<void> {
  return AppMetrics.addCustomMetricToSession({
    sessionId: args.sessionId,
    timestamp: args.timestamp,
    category: 'navigation',
    name: 'tti',
    routeName: args.routeName,
    value: args.value,
    params: { routeParams: args.routeParams },
  });
}
