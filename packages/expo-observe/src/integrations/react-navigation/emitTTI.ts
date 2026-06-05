import type { Session } from 'expo-app-metrics';

export function emitTTI(
  session: Session,
  args: {
    timestamp: string;
    routeName: string | undefined;
    value: number;
    routeParams: object;
  }
): Promise<void> {
  return session.addMetric({
    timestamp: args.timestamp,
    category: 'navigation',
    name: 'tti',
    routeName: args.routeName,
    value: args.value,
    params: { routeParams: args.routeParams },
  });
}
