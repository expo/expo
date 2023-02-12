/// <reference types="expo__bunyan" />
import Log from '@expo/bunyan';
export default class LogReporter {
    logger: Log;
    reportEvent: (event: any) => void;
    constructor(logger: Log, reportEvent?: (event: any) => void);
    update(event: any): void;
}
