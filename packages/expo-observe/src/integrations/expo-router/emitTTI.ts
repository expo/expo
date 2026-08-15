import type { Session } from 'expo-app-metrics';

import type { ObserveIntegrationsConfig } from '../../types';
import { getNavigationMetricParams } from '../navigationConfig';

export function emitTTI(args: {
  session: Pick<Session, 'addMetric'>;
  timestamp: string;
  routeName: string | null | undefined;
  value: number;
  isAppLaunch: boolean;
  routeParams: object | undefined;
  url: string | undefined;
  config?: ObserveIntegrationsConfig['expo-router'];
}): Promise<void> {
  return args.session.addMetric({
    timestamp: args.timestamp,
    category: 'navigation',
    name: 'tti',
    routeName: args.routeName,
    value: args.value,
    params: {
      isAppLaunch: args.isAppLaunch,
      ...getNavigationMetricParams(args.config, args.routeParams, args.url),
    },
  });
}
