import { Host } from '@expo/ui';
import { NavigationSplitView, RNHostView } from '@expo/ui/swift-ui';
import { type ReactElement } from 'react';

export function RouterSplitView({
  sidebar,
  content,
  detail,
}: {
  sidebar: ReactElement;
  content: ReactElement;
  detail: ReactElement;
}) {
  return (
    <Host style={{ flex: 1 }}>
      <NavigationSplitView columnVisibility="all" preferredCompactColumn="content">
        <NavigationSplitView.Sidebar>
          <RNHostView>{sidebar}</RNHostView>
        </NavigationSplitView.Sidebar>
        <NavigationSplitView.Content>
          <RNHostView>{content}</RNHostView>
        </NavigationSplitView.Content>
        <NavigationSplitView.Detail>
          <RNHostView>{detail}</RNHostView>
        </NavigationSplitView.Detail>
      </NavigationSplitView>
    </Host>
  );
}
