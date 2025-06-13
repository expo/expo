import { ViewProps } from 'react-native';
export interface LinkPreviewNativePreviewViewProps extends ViewProps {
    preferredContentSize?: {
        width: number;
        height: number;
    };
}
export interface LinkPreviewNativeTriggerViewProps extends ViewProps {
}
export interface LinkPreviewNativeActionViewProps {
    title: string;
    id: string;
}
export interface LinkPreviewNativeViewProps extends ViewProps {
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
//# sourceMappingURL=types.d.ts.map