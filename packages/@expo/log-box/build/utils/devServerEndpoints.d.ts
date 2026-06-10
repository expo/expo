import type { CodeFrame, MetroStackFrame } from '../Data/Types';
export type SymbolicatedStackTrace = {
    stack: MetroStackFrame[];
    codeFrame?: CodeFrame;
};
export declare function getBaseUrl(): any;
export declare function openFileInEditor(file: string, lineNumber: number): void;
export declare function fetchProjectMetadataAsync(): Promise<{
    projectRoot: string;
    serverRoot: string;
    sdkVersion: string;
}>;
export declare function formatProjectFilePath(projectRoot?: string, file?: string | null): string;
export declare function getFormattedStackTrace(stack: MetroStackFrame[], projectRoot?: string): string;
export declare function isStackFileAnonymous(frame: Pick<MetroStackFrame, 'column' | 'file' | 'lineNumber'>): boolean;
export declare function getStackFormattedLocation(projectRoot: string | undefined, frame: Pick<MetroStackFrame, 'column' | 'file' | 'lineNumber'>): string;
export declare function invalidateCachedStack(stack: MetroStackFrame[]): void;
export declare function symbolicateStackAndCacheAsync(stack: MetroStackFrame[]): Promise<SymbolicatedStackTrace>;
//# sourceMappingURL=devServerEndpoints.d.ts.map