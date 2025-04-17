import { type StackFrame as UpstreamStackFrame } from 'stacktrace-parser';
export type MetroStackFrame = UpstreamStackFrame & {
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
    stack: MetroStackFrame[];
    codeFrame?: CodeFrame;
};
export declare function installPackageInProject(pkg: string): void;
export declare function openFileInEditor(file: string, lineNumber: number): void;
export declare function fetchProjectMetadataAsync(): Promise<{
    projectRoot: string;
    serverRoot: string;
    sdkVersion: string;
}>;
export declare function formatProjectFilePath(projectRoot: string, file?: string | null): string;
export declare function getFormattedStackTrace(projectRoot: string, stack: MetroStackFrame[]): string;
export declare function isStackFileAnonymous(frame: Pick<MetroStackFrame, 'column' | 'file' | 'lineNumber'>): boolean;
export declare function getStackFormattedLocation(projectRoot: string, frame: Pick<MetroStackFrame, 'column' | 'file' | 'lineNumber'>): string;
export declare function parseErrorStack(stack?: string): MetroStackFrame[];
export declare function invalidateCachedStack(stack: MetroStackFrame[]): void;
export declare function symbolicateStackAndCacheAsync(stack: MetroStackFrame[]): Promise<SymbolicatedStackTrace>;
//# sourceMappingURL=devServerEndpoints.d.ts.map