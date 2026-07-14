import type { Session } from 'expo-app-metrics';
import type { ObserveIntegrationsConfig } from '../../types';
export declare function emitTTI(args: {
    session: Pick<Session, 'addMetric'>;
    timestamp: string;
    routeName: string | null | undefined;
    value: number;
    isAppLaunch: boolean;
    routeParams: object | undefined;
    url: string | undefined;
    config?: ObserveIntegrationsConfig['expo-router'];
}): Promise<void>;
//# sourceMappingURL=emitTTI.d.ts.map