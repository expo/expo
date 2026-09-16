import { Host } from '@expo/ui';
import { NavigationSplitView, RNHostView, Toolbar } from '@expo/ui/swift-ui';
import {
  navigationBarBackButtonHidden,
  navigationBarTitleDisplayMode,
  navigationSplitViewColumnWidth,
  navigationSplitViewStyle,
  navigationTitle,
  toolbarVisibility,
  type ViewModifier,
} from '@expo/ui/swift-ui/modifiers';

import { type RouterSplitViewProps, type SplitViewColumn } from './router-split-view.types';

export function RouterSplitView({
  sidebar,
  content,
  detail,
  compactColumn,
  onCompactColumnChange,
}: RouterSplitViewProps) {
  return (
    <Host style={{ flex: 1 }}>
      <NavigationSplitView
        columnVisibility="all"
        preferredCompactColumn={compactColumn}
        onPreferredCompactColumnChange={onCompactColumnChange}
        modifiers={[navigationSplitViewStyle('balanced')]}>
        <NavigationSplitView.Sidebar>
          <Column column={sidebar} modifiers={[toolbarVisibility('hidden')]} />
        </NavigationSplitView.Sidebar>
        <NavigationSplitView.Content>
          <Column
            column={content}
            modifiers={[navigationSplitViewColumnWidth({ min: 280, ideal: 320, max: 400 })]}
          />
        </NavigationSplitView.Content>
        <NavigationSplitView.Detail>
          <Column column={detail} />
        </NavigationSplitView.Detail>
      </NavigationSplitView>
    </Host>
  );
}

function Column({
  column,
  modifiers = [],
}: {
  column: SplitViewColumn;
  modifiers?: ViewModifier[];
}) {
  return (
    <Toolbar
      modifiers={[
        navigationTitle(column.title),
        navigationBarTitleDisplayMode(column.titleDisplayMode ?? 'automatic'),
        navigationBarBackButtonHidden(column.backButtonHidden ?? false),
        ...modifiers,
      ]}>
      <RNHostView>{column.children}</RNHostView>
      <Toolbar.Content>{column.toolbarItems}</Toolbar.Content>
    </Toolbar>
  );
}
