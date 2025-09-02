import { type ViewProps } from 'react-native';
export interface NativeLinkPreviewActionProps {
    title: string;
    icon?: string;
    children?: React.ReactNode;
    disabled?: boolean;
    destructive?: boolean;
    displayAsPalette?: boolean;
    displayInline?: boolean;
    isOn?: boolean;
    keepPresented?: boolean;
    onSelected: () => void;
}
export declare function NativeLinkPreviewAction(props: NativeLinkPreviewActionProps): import("react").JSX.Element | null;
export interface TabPath {
    oldTabKey: string;
    newTabKey: string;
}
export interface NativeLinkPreviewProps extends ViewProps {
    nextScreenId: string | undefined;
    tabPath: {
        path: TabPath[];
    } | undefined;
    disableForceFlatten?: boolean;
    onWillPreviewOpen?: () => void;
    onDidPreviewOpen?: () => void;
    onPreviewWillClose?: () => void;
    onPreviewDidClose?: () => void;
    onPreviewTapped?: () => void;
    onPreviewTappedAnimationCompleted?: () => void;
    children: React.ReactNode;
}
export declare function NativeLinkPreview(props: NativeLinkPreviewProps): import("react").JSX.Element | null;
export interface NativeLinkPreviewContentProps extends ViewProps {
    preferredContentSize?: {
        width: number;
        height: number;
    };
}
export declare function NativeLinkPreviewContent(props: NativeLinkPreviewContentProps): import("react").JSX.Element | null;
//# sourceMappingURL=native.d.ts.map