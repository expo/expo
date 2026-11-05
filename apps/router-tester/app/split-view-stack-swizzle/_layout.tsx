import { SplitView } from 'expo-router/unstable-split-view';
import { useRef, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import type { SplitHostCommands } from 'react-native-screens/experimental';

import { Control, DemoContext } from '@/components/split-view-stack-swizzle';

export default function Layout() {
  const splitRef = useRef<SplitHostCommands>(null);
  const [rootHidden, setRootHidden] = useState(false);
  const [largeTitle, setLargeTitle] = useState(false);
  const [gestureEnabled, setGestureEnabled] = useState(true);
  const [count, setCount] = useState(0);

  return (
    <DemoContext.Provider
      value={{
        rootHidden,
        setRootHidden,
        largeTitle,
        setLargeTitle,
        gestureEnabled,
        setGestureEnabled,
        count,
        setCount,
        showSidebar: () => splitRef.current?.show('supplementary'),
        showMiddle: () => splitRef.current?.show('primary'),
      }}>
      <SplitView
        ref={splitRef}
        preferredDisplayMode="twoBesideSecondary"
        showSecondaryToggleButton
        disableHorizontalSafeAreaInsets>
        <SplitView.Column header={{ title: 'Sidebar' }}>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{ padding: 20 }}>
            <Text>Sidebar column</Text>
            <Control label="Show middle column" onPress={() => splitRef.current?.show('primary')} />
          </ScrollView>
        </SplitView.Column>
        <SplitView.Column header={{ title: 'Middle' }}>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{ padding: 20 }}>
            <Text>Middle column</Text>
            <Control label="Show content" onPress={() => splitRef.current?.show('secondary')} />
          </ScrollView>
        </SplitView.Column>
        <SplitView.Content header={{ title: 'Split root', hidden: rootHidden, largeTitle }} />
      </SplitView>
    </DemoContext.Provider>
  );
}
