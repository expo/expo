import React from "react";
import { LogBoxLog, StackType } from "./Data/LogBoxLog";
export declare function LogBoxInspectorContainer(): JSX.Element | null;
export declare function LogBoxInspector({ log, selectedLogIndex, logs, }: {
    log: LogBoxLog;
    selectedLogIndex: number;
    logs: LogBoxLog[];
}): JSX.Element;
export declare function ErrorOverlayBody({ onRetry, }: {
    onRetry: (type: StackType) => void;
}): JSX.Element;
export declare function ErrorOverlayBodyContents({ log, onRetry, }: {
    log: LogBoxLog;
    onRetry: (type: StackType) => void;
}): JSX.Element;
declare const _default: React.Component<object, {}, any>;
export default _default;
//# sourceMappingURL=ErrorOverlay.d.ts.map