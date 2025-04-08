import { type StackFrame as UpstreamStackFrame } from 'stacktrace-parser';
type StackFrame = UpstreamStackFrame & {
    collapse?: boolean;
};
export type CodeFrame = {
    content: string;
    location?: {
        row: number;
        column: number;
        [key: string]: any;
    };
    fileName: string;
};
export type SymbolicatedStackTrace = {
    stack: StackFrame[];
    codeFrame?: CodeFrame;
};
export declare function openFileInEditor(file: string, lineNumber: number): void;
export declare function formatProjectFilePath(projectRoot: string, file?: string | null): string;
export declare function getStackFormattedLocation(projectRoot: string, frame: Pick<StackFrame, 'column' | 'file' | 'lineNumber'>): string;
export declare function parseErrorStack(stack?: string): (StackFrame & {
    collapse?: boolean;
})[];
export type Stack = StackFrame[];
export declare function invalidateCachedStack(stack: Stack): void;
export declare function symbolicateStackAndCacheAsync(stack: Stack): Promise<SymbolicatedStackTrace>;
export {};
//# sourceMappingURL=devServerEndpoints.d.ts.map