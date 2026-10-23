import { Host } from '@expo/ui';
import {
  Group,
  NavigationSplitView,
  type NavigationSplitViewColumn,
  RNHostView,
} from '@expo/ui/swift-ui';
import { navigationBarTitleDisplayMode, navigationTitle } from '@expo/ui/swift-ui/modifiers';
import { Link, usePathname } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';

export default function Layout() {
  const pathname = usePathname();
  const [compactColumn, setCompactColumn] = useState<NavigationSplitViewColumn>(() =>
    pathname === '/split-view-ui' ? 'sidebar' : 'detail'
  );
  const [detailTitle, setDetailTitle] = useState('Detail');

  return (
    <Host style={{ flex: 1 }}>
      <NavigationSplitView
        preferredCompactColumn={compactColumn}
        onPreferredCompactColumnChange={setCompactColumn}>
        <NavigationSplitView.Sidebar>
          <Group modifiers={[navigationTitle('Items'), navigationBarTitleDisplayMode('large')]}>
            <RNHostView>
              <ScrollView
                style={{ flex: 1, backgroundColor: '#f2f2f7' }}
                contentContainerStyle={{ padding: 20, gap: 16 }}>
                {['One', 'Two'].map((item) => (
                  <Link
                    key={item}
                    href={`/split-view-ui/${item.toLowerCase()}`}
                    onPress={() => setCompactColumn('detail')}
                    asChild>
                    <Pressable
                      accessibilityRole="button"
                      style={{ padding: 12, backgroundColor: 'white' }}>
                      <Text>Open {item}</Text>
                    </Pressable>
                  </Link>
                ))}
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    setDetailTitle((title) =>
                      title === 'Detail' ? 'Updated detail title' : 'Detail'
                    )
                  }
                  style={{ padding: 12, backgroundColor: 'white' }}>
                  <Text>Change detail title</Text>
                </Pressable>
              </ScrollView>
            </RNHostView>
          </Group>
        </NavigationSplitView.Sidebar>
        <NavigationSplitView.Detail>
          <Group
            modifiers={[navigationTitle(detailTitle), navigationBarTitleDisplayMode('inline')]}>
            <RNHostView>
              <Stack screenOptions={{ headerShown: false }} />
            </RNHostView>
          </Group>
        </NavigationSplitView.Detail>
      </NavigationSplitView>
    </Host>
  );
}
