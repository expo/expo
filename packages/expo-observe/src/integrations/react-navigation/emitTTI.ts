import type { Session } from 'expo-app-metrics';

export function emitTTI(args: {
  session: Pick<Session, 'addMetric'>;
  timestamp: string;
  routeName: string | undefined;
  value: number;
  routeParams: object;
  urlHidden?: true;
}): Promise<void> {
  return args.session.addMetric({
    timestamp: args.timestamp,
    category: 'navigation',
    name: 'tti',
    routeName: args.routeName,
    value: args.value,
    params: { routeParams: args.routeParams, ...(args.urlHidden ? { urlHidden: true } : {}) },
  });
}
