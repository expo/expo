import { LogData, LogLevel } from './RemoteLogging';
declare type SerializedData = {
    body: LogData[];
    includesStack: boolean;
};
export declare const EXPO_CONSOLE_METHOD_NAME = "__expoConsoleLog";
declare function serializeLogDataAsync(data: unknown[], level: LogLevel): Promise<SerializedData>;
declare const _default: {
    serializeLogDataAsync: typeof serializeLogDataAsync;
};
export default _default;
//# sourceMappingURL=LogSerialization.d.ts.map