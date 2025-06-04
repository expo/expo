import { ViewProps } from 'react-native';
export interface PeekAndPopPreviewViewProps extends ViewProps {
    onSetSize?: (event: {
        nativeEvent: {
            width: number;
            height: number;
        };
    }) => void;
}
export interface PeekAndPopTriggerViewProps extends ViewProps {
}
export interface PeekAndPopViewProps extends ViewProps {
    nextScreenKey: number;
    onWillPreviewOpen?: () => void;
    onDidPreviewOpen?: () => void;
    onPreviewClose?: () => void;
    onPreviewTapped?: () => void;
    children: React.ReactNode;
}
//# sourceMappingURL=types.d.ts.map