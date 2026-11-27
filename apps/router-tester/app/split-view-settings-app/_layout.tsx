import { useGlobalSearchParams, useRouter, type Href } from 'expo-router';
import { SplitView } from 'expo-router/unstable-split-view';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { PlatformColor, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { useContentScreens } from '@/components/split-view-content-stack';
import {
  ACCOUNT,
  SECTION_GROUPS,
  SettingsGroup,
  SettingsIcon,
  SettingsRow,
  settingsStyles,
} from '@/components/split-view-settings';

export default function Layout() {
  // Navigation does not reveal a column, so the content column is shown with the split view commands.
  const splitRef = useRef<ComponentRef<typeof SplitView>>(null);
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [airplaneMode, setAirplaneMode] = useState(false);
  const { section } = useGlobalSearchParams<{ section?: string }>();
  const contentScreens = useContentScreens('split-view-settings-app');
  const showsIndex = contentScreens.at(-1) === 'index';

  // Collapsed, the index placeholder is not a page of its own: back from a section goes on to the list.
  useEffect(() => {
    if (collapsed && showsIndex) splitRef.current?.show('primary');
  }, [collapsed, showsIndex]);

  const open = (id: string) => {
    const href: Href = `/split-view-settings-app/${id}`;
    // screens v5 cannot replace the root screen of a stack (react-native-screens#5340), and the
    // placeholder stays below the pages, so a page opened from it is pushed. screens v5 also cannot pop
    // several screens and push in one update, so the open page is replaced and its parents stay below.
    if (contentScreens.length > 1 && !showsIndex) {
      router.replace(href);
    } else {
      router.push(href);
    }
    splitRef.current?.show('secondary');
  };

  const row = (id: string, title: string, icon: React.ReactNode, value?: string) => (
    <SettingsRow
      key={id}
      title={title}
      value={value}
      icon={icon}
      // The expanded sidebar marks the open section. The collapsed list shows chevrons instead.
      selected={!collapsed && section === id}
      chevron={collapsed}
      onPress={() => open(id)}
    />
  );

  return (
    <SplitView
      ref={splitRef}
      preferredDisplayMode="oneBesideSecondary"
      topColumnForCollapsing="primary"
      onCollapse={() => setCollapsed(true)}
      onExpand={() => setCollapsed(false)}>
      <SplitView.Column header={{ title: 'Settings', ios: { largeTitleEnabled: true } }}>
        <ScrollView
          testID="split-view-settings-sidebar"
          style={settingsStyles.screen}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={settingsStyles.content}>
          <SettingsGroup>
            {row(
              ACCOUNT.id,
              ACCOUNT.title,
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>JD</Text>
              </View>
            )}
          </SettingsGroup>
          <SettingsGroup>
            <SettingsRow
              title="Airplane Mode"
              icon={<SettingsIcon icon="airplane" color="systemOrange" />}
              accessory={
                <Switch
                  testID="split-view-settings-airplane"
                  accessibilityLabel="Airplane Mode"
                  value={airplaneMode}
                  onValueChange={setAirplaneMode}
                />
              }
            />
            {SECTION_GROUPS[0]!.map((s) =>
              row(s.id, s.title, <SettingsIcon icon={s.icon} color={s.color} />, s.value)
            )}
          </SettingsGroup>
          {SECTION_GROUPS.slice(1).map((group, index) => (
            <SettingsGroup key={index}>
              {group.map((s) =>
                row(s.id, s.title, <SettingsIcon icon={s.icon} color={s.color} />, s.value)
              )}
            </SettingsGroup>
          ))}
        </ScrollView>
      </SplitView.Column>
      <SplitView.Content stackIntegration />
    </SplitView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PlatformColor('systemGray2'),
  },
  avatarText: { color: 'white', fontSize: 13, fontWeight: '600' },
});
