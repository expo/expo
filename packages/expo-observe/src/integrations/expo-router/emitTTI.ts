import type { Session } from 'expo-app-metrics';

export function emitTTI(
  session: Session,
  args: {
    timestamp: string;
    routeName: string | null | undefined;
    value: number;
    isAppLaunch: boolean;
    routeParams: object | undefined;
    url: string | undefined;
  }
): Promise<void> {
  return session.addMetric({
    timestamp: args.timestamp,
    category: 'navigation',
    name: 'tti',
    routeName: args.routeName,
    value: args.value,
    params: { isAppLaunch: args.isAppLaunch, routeParams: args.routeParams, url: args.url },
  });
}
