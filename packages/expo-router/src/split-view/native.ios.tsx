import { requireNativeView, requireNativeModule } from 'expo';
import type { ViewProps } from 'react-native';

import type {
  SplitViewNativeHeaderProps,
  SplitViewNativeColumnProps,
  SplitViewNativeStackScreenProps,
} from './native.types';

const SplitViewHeaderView: React.ComponentType<ViewProps & SplitViewNativeHeaderProps> =
  requireNativeView('ExpoRouterSplitViewModule', 'SplitViewHeaderView');

export function SplitViewNativeHeader(props: SplitViewNativeHeaderProps) {
  return (
    <SplitViewHeaderView
      {...props}
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}
    />
  );
}

const ColumnView: React.ComponentType<ViewProps & SplitViewNativeColumnProps> = requireNativeView(
  'ExpoRouterSplitViewModule',
  'SplitViewColumnView'
);
const StackScreenView: React.ComponentType<ViewProps & SplitViewNativeStackScreenProps> =
  requireNativeView('ExpoRouterSplitViewModule', 'SplitViewStackScreenView');

const markerStyle = { position: 'absolute', width: 0, height: 0 } satisfies ViewProps['style'];

export function SplitViewNativeColumn(props: SplitViewNativeColumnProps) {
  return <ColumnView {...props} pointerEvents="none" style={markerStyle} />;
}

export function SplitViewNativeStackScreen(props: SplitViewNativeStackScreenProps) {
  return (
    <StackScreenView
      {...props}
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    />
  );
}

export function showSplitViewSidebar(columnId: string) {
  return requireNativeModule('ExpoRouterSplitViewModule').showSidebar(columnId);
}
