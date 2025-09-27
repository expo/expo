import type { StackFrame } from 'stacktrace-parser';
export type MetroStackFrame = StackFrame & {
    collapse?: boolean;
};
export declare function formatProjectFilePath(projectRoot: string, file?: string | null): string;
export declare function getStackFormattedLocation(projectRoot: string, frame: Pick<MetroStackFrame, 'column' | 'file' | 'lineNumber'>): string;
//# sourceMappingURL=formatProjectFilePath.d.ts.map