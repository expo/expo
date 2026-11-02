import { SplitView } from 'expo-router/unstable-split-view';
import { useState } from 'react';

import { ScopeContext, ScopeSidebar, type ScopeOptions } from '../../components/split-stack-scope';

export default function Layout() {
  const [options, setOptions] = useState<ScopeOptions>({
    omitContent: false,
    splitHeaderHidden: false,
    threeColumns: false,
    disableHorizontalSafeAreaInsets: false,
    showInspector: false,
    titleRevision: 0,
    fullScreenModal: false,
    stackHeaderHidden: false,
    rootGestureEnabled: true,
    showSecondaryToggleButton: false,
  });
  return (
    <ScopeContext value={{ options, setOptions }}>
      <SplitView
        topColumnForCollapsing="secondary"
        preferredDisplayMode={options.threeColumns ? 'twoBesideSecondary' : 'oneBesideSecondary'}
        disableHorizontalSafeAreaInsets={options.disableHorizontalSafeAreaInsets}
        showInspector={options.showInspector}
        showSecondaryToggleButton={options.showSecondaryToggleButton}>
        <SplitView.Column header={{ title: 'Scope sidebar' }}>
          <ScopeSidebar />
        </SplitView.Column>
        {options.threeColumns && (
          <SplitView.Column header={{ title: 'Middle column' }}>
            <ScopeSidebar />
          </SplitView.Column>
        )}
        {!options.omitContent && (
          <SplitView.Content
            header={{ title: 'Split content bar', hidden: options.splitHeaderHidden }}
          />
        )}
        <SplitView.Inspector header={{ title: 'Scope inspector' }}>
          <ScopeSidebar />
        </SplitView.Inspector>
      </SplitView>
    </ScopeContext>
  );
}
