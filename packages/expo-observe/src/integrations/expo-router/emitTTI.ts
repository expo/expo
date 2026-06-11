import AppMetrics from 'expo-app-metrics';

export function emitTTI(args: {
  sessionId: string;
  timestamp: string;
  routeName: string | null | undefined;
  value: number;
  isAppLaunch: boolean;
  routeParams: object | undefined;
  url: string | undefined;
}): Promise<void> {
  return AppMetrics.addCustomMetricToSession({
    sessionId: args.sessionId,
    timestamp: args.timestamp,
    category: 'navigation',
    name: 'tti',
    routeName: args.routeName,
    value: args.value,
    params: { isAppLaunch: args.isAppLaunch, routeParams: args.routeParams, url: args.url },
  });
}
