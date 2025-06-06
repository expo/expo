import { ViewProps } from 'react-native';

export interface PeekAndPopPreviewViewProps extends ViewProps {
  onSetSize?: (event: { nativeEvent: { width: number; height: number } }) => void;
}
export interface PeekAndPopTriggerViewProps extends ViewProps {}
export interface PeekAndPopViewProps extends ViewProps {
  nextScreenId: string | undefined;
  onWillPreviewOpen?: () => void;
  onDidPreviewOpen?: () => void;
  onPreviewWillClose?: () => void;
  onPreviewDidClose?: () => void;
  onPreviewTapped?: () => void;
  children: React.ReactNode;
}
