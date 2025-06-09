import { ViewProps } from 'react-native';

export interface PeekAndPopPreviewViewProps extends ViewProps {
  onSetSize?: (event: { nativeEvent: { width: number; height: number } }) => void;
}
export interface PeekAndPopTriggerViewProps extends ViewProps {}
export interface PeekAndPopViewProps extends ViewProps {
  nextScreenId: string | undefined;
  actions: { title: string; id: string }[];
  preferredContentSize?: { width?: number; height?: number } | undefined;
  onActionSelected?: (event: { nativeEvent: { id: string } }) => void;
  onWillPreviewOpen?: () => void;
  onDidPreviewOpen?: () => void;
  onPreviewWillClose?: () => void;
  onPreviewDidClose?: () => void;
  onPreviewTapped?: () => void;
  children: React.ReactNode;
}
