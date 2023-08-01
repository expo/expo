import React from 'react';
import { LogBoxLog } from './LogBoxLog';
export declare const LogContext: React.Context<{
    selectedLogIndex: number;
    isDisabled: boolean;
    logs: LogBoxLog[];
} | null>;
export declare function useLogs(): {
    selectedLogIndex: number;
    isDisabled: boolean;
    logs: LogBoxLog[];
};
export declare function useSelectedLog(): LogBoxLog;
//# sourceMappingURL=LogContext.d.ts.map