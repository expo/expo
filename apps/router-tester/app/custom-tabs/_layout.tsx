import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = ComponentProps<typeof Ionicons>['name'];

const tint = 'rgb(11, 103, 175)';

export default function Layout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs style={styles.tabs}>
      <TabSlot />
      <TabList style={[styles.tabList, { paddingBottom: insets.bottom + 6 }]}>
        <TabTrigger name="index" href="/custom-tabs" asChild>
          <TabButton icon="home">Home</TabButton>
        </TabTrigger>
        <TabTrigger name="library" href="/custom-tabs/library" asChild>
          <TabButton icon="albums">Library</TabButton>
        </TabTrigger>
        <TabTrigger name="settings" href="/custom-tabs/settings" asChild>
          <TabButton icon="settings">Settings</TabButton>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  icon,
  children,
  isFocused,
  ...props
}: Omit<TabTriggerSlotProps, 'ref'> & { icon: IconName; children: string }) {
  const color = isFocused ? tint : '#8e8e93';

  return (
    <Pressable {...props} style={styles.trigger}>
      <View style={[styles.pill, isFocused && styles.pillFocused]}>
        <Ionicons
          name={isFocused ? icon : (`${icon}-outline` as IconName)}
          size={22}
          color={color}
        />
        <Text style={[styles.label, { color }]}>{children}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flex: 1,
  },
  tabList: {
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#c6c6c8',
    paddingTop: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  trigger: {
    flex: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  pillFocused: {
    backgroundColor: 'rgba(11, 103, 175, 0.12)',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
