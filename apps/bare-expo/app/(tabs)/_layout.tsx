import { NativeTabs } from 'expo-router/unstable-native-tabs';
import * as React from 'react';

import { optionalRequire } from '../../optionalRequire';

// The apis/components tabs render screens from `native-component-list`;
// hide them when the package isn't bundled.
const hasNativeComponentList = !!optionalRequire(() =>
  require('native-component-list/src/navigation/screenRegistry')
);

export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="test-suite">
        <NativeTabs.Trigger.Icon sf="checklist" md="checklist" />
        <NativeTabs.Trigger.Label>Tests</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="playground">
        <NativeTabs.Trigger.Icon sf="flask" md="science" />
        <NativeTabs.Trigger.Label>Playground</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="apis" hidden={!hasNativeComponentList}>
        <NativeTabs.Trigger.Icon sf="chevron.left.forwardslash.chevron.right" md="code" />
        <NativeTabs.Trigger.Label>APIs</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="components" hidden={!hasNativeComponentList}>
        <NativeTabs.Trigger.Icon sf="atom" md="widgets" />
        <NativeTabs.Trigger.Label>Components</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
