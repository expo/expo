import { type ViewProps } from 'react-native';
export interface NativeLinkPreviewActionProps {
    title: string;
    icon?: string;
    id: string;
    children?: React.ReactNode;
}
export declare function NativeLinkPreviewAction(props: NativeLinkPreviewActionProps): import("react").JSX.Element | null;
export type NativeLinkPreviewTriggerProps = ViewProps;
export declare function NativeLinkPreviewTrigger(props: NativeLinkPreviewTriggerProps): import("react").JSX.Element | null;
export interface NativeLinkPreviewProps extends ViewProps {
    nextScreenId: string | undefined;
    onActionSelected?: (event: {
        nativeEvent: {
            id: string;
        };
    }) => void;
    onWillPreviewOpen?: () => void;
    onDidPreviewOpen?: () => void;
    onPreviewWillClose?: () => void;
    onPreviewDidClose?: () => void;
    onPreviewTapped?: () => void;
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