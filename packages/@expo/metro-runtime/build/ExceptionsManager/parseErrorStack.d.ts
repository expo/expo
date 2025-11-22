import { type StackFrame as UpstreamStackFrame } from 'stacktrace-parser';
export type MetroStackFrame = UpstreamStackFrame & {
    collapse?: boolean;
};
export declare function parseErrorStack(stack?: string): MetroStackFrame[];
//# sourceMappingURL=parseErrorStack.d.ts.map