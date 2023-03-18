import { EventSubscription } from 'fbemitter';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogEntryFields = {
    shouldHide?: boolean;
    groupDepth?: number;
    groupCollapsed?: boolean;
};
export type LogData = string | LogErrorData;
export type LogErrorData = {
    message: string;
    stack: string;
};
type TransportErrorListener = (event: {
    error: Error;
    response?: Response;
}) => void;
declare function enqueueRemoteLogAsync(level: LogLevel, additionalFields: LogEntryFields, data: unknown[]): Promise<void>;
declare function addTransportErrorListener(listener: TransportErrorListener): EventSubscription;
declare const _default: {
    enqueueRemoteLogAsync: typeof enqueueRemoteLogAsync;
    addTransportErrorListener: typeof addTransportErrorListener;
};
export default _default;
/**
 * Returns a promise that resolves when all entries in the log queue have been sent. This method is
 * intended for testing only.
 */
export declare function __waitForEmptyLogQueueAsync(): Promise<void>;
//# sourceMappingURL=RemoteLogging.d.ts.map