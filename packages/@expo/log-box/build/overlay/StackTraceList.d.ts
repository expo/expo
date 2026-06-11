import type { StackType, MetroStackFrame } from '../Data/Types';
export declare function StackTraceList({ onRetry, type, stack, symbolicationStatus, }: {
    type: StackType;
    onRetry: () => void;
    stack: MetroStackFrame[] | null;
    symbolicationStatus: 'COMPLETE' | 'FAILED' | 'NONE' | 'PENDING';
}): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=StackTraceList.d.ts.map