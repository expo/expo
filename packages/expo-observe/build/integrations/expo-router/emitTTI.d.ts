import type { Session } from 'expo-app-metrics';
export declare function emitTTI(args: {
    session: Pick<Session, 'addMetric'>;
    timestamp: string;
    routeName: string | null | undefined;
    value: number;
    isAppLaunch: boolean;
    routeParams: object | undefined;
    url: string | undefined;
}): Promise<void>;
//# sourceMappingURL=emitTTI.d.ts.map