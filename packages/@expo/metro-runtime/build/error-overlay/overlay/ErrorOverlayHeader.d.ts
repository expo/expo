import React from 'react';
import type { LogLevel } from '../Data/LogBoxLog';
export declare function ErrorOverlayHeader({ selectedIndex, total, sdkVersion, ...props }: {
    onSelectIndex: (selectedIndex: number) => void;
    level: LogLevel;
    onDismiss: () => void;
    onMinimize: () => void;
    onCopy: () => void;
    isDismissable: boolean;
    selectedIndex: number;
    sdkVersion?: string;
    total: number;
}): React.JSX.Element;
//# sourceMappingURL=ErrorOverlayHeader.d.ts.map