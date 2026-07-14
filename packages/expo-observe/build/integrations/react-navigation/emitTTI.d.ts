import type { Session } from 'expo-app-metrics';
export declare function emitTTI(args: {
    session: Pick<Session, 'addMetric'>;
    timestamp: string;
    routeName: string | undefined;
    value: number;
    routeParams: object;
    urlHidden?: true;
}): Promise<void>;
//# sourceMappingURL=emitTTI.d.ts.map