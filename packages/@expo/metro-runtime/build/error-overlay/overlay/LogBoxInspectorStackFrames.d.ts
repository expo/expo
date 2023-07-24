import type { StackType } from "../Data/LogBoxLog";
import type { Stack } from "../Data/LogBoxSymbolication";
type Props = {
    type: StackType;
    onRetry: () => void;
};
export declare function getCollapseMessage(stackFrames: Stack, collapsed: boolean): string;
export declare function LogBoxInspectorStackFrames({ onRetry, type }: Props): JSX.Element | null;
export {};
//# sourceMappingURL=LogBoxInspectorStackFrames.d.ts.map