import type { LogLevel } from '../Data/Types';
export declare function ErrorOverlayHeader({ selectedIndex, total, sdkVersion, ...props }: {
    onSelectIndex: (selectedIndex: number) => void;
    level: LogLevel;
    onDismiss: () => void;
    onMinimize: () => void;
    onCopy: () => void;
    onReload?: () => void;
    isDismissable: boolean;
    selectedIndex: number;
    sdkVersion?: string;
    total: number;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Header.d.ts.map