import { useGlobalSearchParams, useRouter } from 'expo-router';
import {
  SplitView,
  type SplitViewHeader,
  type SplitViewToolbarItem,
} from 'expo-router/unstable-split-view';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { PlatformColor, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SplitHostCommands } from 'react-native-screens/experimental';
import type { SFSymbol } from 'sf-symbols-typescript';

import { ToggleRow } from '@/components/ToggleRow';
import { MESSAGES, ToolbarPressContext } from '@/components/split-view-mail';

const MAILBOXES: { name: string; icon: SFSymbol }[] = [
  { name: 'Inbox', icon: 'tray' },
  { name: 'VIP', icon: 'star' },
  { name: 'Drafts', icon: 'doc' },
  { name: 'Sent', icon: 'paperplane' },
  { name: 'Junk', icon: 'xmark.bin' },
  { name: 'Bin', icon: 'trash' },
  { name: 'All Mail', icon: 'tray.2' },
];

// Applied to every column after the first, whose back button shows when the split view is collapsed.
const BACK_BUTTONS: { label: string; options: SplitViewHeader }[] = [
  { label: 'Default', options: {} },
  { label: 'Minimal', options: { backButtonDisplayMode: 'minimal' } },
  { label: 'Custom title', options: { backTitle: 'Back to list' } },
  { label: 'Hidden', options: { backVisible: false } },
];

export default function Layout() {
  const router = useRouter();
  // Navigation does not reveal a column, so the selected column is shown with the split view commands.
  const splitRef = useRef<SplitHostCommands>(null);
  const [collapsed, setCollapsed] = useState(false);
  const { id } = useGlobalSearchParams<{ id?: string }>();
  const message = MESSAGES.find((m) => m.id === id);

  const [showHeaders, setShowHeaders] = useState(true);
  const [alternateTitles, setAlternateTitles] = useState(false);
  const [largeTitle, setLargeTitle] = useState(true);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [titleColors, setTitleColors] = useState(false);
  const [iconButtons, setIconButtons] = useState(true);
  const [threeColumns, setThreeColumns] = useState(true);
  const [showInspector, setShowInspector] = useState(false);
  const [press, setPress] = useState({ title: '', count: 0 });
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [buttonStates, setButtonStates] = useState(false);
  const [styledButtons, setStyledButtons] = useState(false);
  const [backButtonIndex, setBackButtonIndex] = useState(0);
  const backButton = BACK_BUTTONS[backButtonIndex];

  const button = (title: string, icon?: SFSymbol): SplitViewToolbarItem => ({
    title,
    icon: iconButtons ? icon : undefined,
    onPress: () => setPress((p) => ({ title, count: p.count + 1 })),
  });
  const pressLabel = press.count ? `${press.title} (${press.count})` : 'None';

  return (
    <ToolbarPressContext value={pressLabel}>
      <SplitView
        ref={splitRef}
        preferredDisplayMode="twoBesideSecondary"
        showInspector={showInspector}
        onCollapse={() => setCollapsed(true)}
        onExpand={() => setCollapsed(false)}>
        <SplitView.Column
          header={
            showHeaders
              ? {
                  title: alternateTitles ? 'Folders' : 'Mailboxes',
                  subtitle: showSubtitle ? '3 unread' : undefined,
                  largeTitle,
                  titleStyle: titleColors ? { color: 'red' } : undefined,
                  largeTitleStyle: titleColors ? { color: 'blue' } : undefined,
                  rightToolbar: [button('Edit')],
                  searchBar: {
                    placeholder: 'Search mailboxes',
                    onChangeText: (event) => setSearch(event.nativeEvent.text),
                  },
                }
              : undefined
          }>
          <ScrollView contentInsetAdjustmentBehavior="automatic">
            {MAILBOXES.filter((mailbox) =>
              mailbox.name.toLowerCase().includes(search.toLowerCase())
            ).map((mailbox) => (
              <Pressable
                key={mailbox.name}
                style={styles.row}
                onPress={() => {
                  // When expanded, `show` would close the sidebar overlay.
                  if (collapsed && threeColumns) splitRef.current?.show('supplementary');
                }}>
                <SymbolView name={mailbox.icon} size={20} />
                <Text style={styles.rowTitle}>{mailbox.name}</Text>
              </Pressable>
            ))}
            <View style={styles.controls}>
              <Text style={styles.sectionTitle}>Test cases</Text>
              <Pressable testID="split-view-mail-home" onPress={() => router.replace('/')}>
                <Text style={styles.link}>Back to home</Text>
              </Pressable>
              <Text testID="split-view-mail-press">Last toolbar press: {pressLabel}</Text>
              <ToggleRow
                label="Headers"
                testID="split-view-mail-headers"
                value={showHeaders}
                onValueChange={(value) => {
                  setShowHeaders(value);
                  setSearch('');
                }}
              />
              <ToggleRow
                label="Alternate titles"
                testID="split-view-mail-titles"
                value={alternateTitles}
                onValueChange={setAlternateTitles}
              />
              <ToggleRow
                label="Large title"
                testID="split-view-mail-large-title"
                value={largeTitle}
                onValueChange={setLargeTitle}
              />
              <ToggleRow
                label="Subtitle"
                testID="split-view-mail-subtitle"
                value={showSubtitle}
                onValueChange={setShowSubtitle}
              />
              <ToggleRow
                label="Title colors"
                testID="split-view-mail-title-colors"
                value={titleColors}
                onValueChange={setTitleColors}
              />
              <ToggleRow
                label="Icon buttons"
                testID="split-view-mail-icons"
                value={iconButtons}
                onValueChange={setIconButtons}
              />
              <ToggleRow
                label="Selected Unread, disabled Archive"
                testID="split-view-mail-button-states"
                value={buttonStates}
                onValueChange={setButtonStates}
              />
              <ToggleRow
                label="Styled buttons"
                testID="split-view-mail-styled-buttons"
                value={styledButtons}
                onValueChange={setStyledButtons}
              />
              <Pressable
                testID="split-view-mail-back-button"
                onPress={() => setBackButtonIndex((index) => (index + 1) % BACK_BUTTONS.length)}>
                <Text style={styles.link}>Back button: {backButton.label}</Text>
              </Pressable>
              <ToggleRow
                label="Three columns"
                testID="split-view-mail-three-columns"
                value={threeColumns}
                onValueChange={setThreeColumns}
              />
              <ToggleRow
                label="Inspector"
                testID="split-view-mail-inspector"
                value={showInspector}
                onValueChange={setShowInspector}
              />
            </View>
          </ScrollView>
        </SplitView.Column>
        {threeColumns && (
          <SplitView.Column
            header={
              showHeaders
                ? {
                    ...backButton.options,
                    title: alternateTitles ? 'Gmail' : 'Inbox Gmail',
                    rightToolbar: [
                      {
                        title: 'Filter',
                        icon: iconButtons ? 'line.3.horizontal.decrease.circle' : undefined,
                        menu: {
                          title: 'Filter by',
                          items: [
                            {
                              title: 'Unread',
                              icon: 'envelope.badge',
                              isOn: unreadOnly,
                              onPress: () => {
                                setUnreadOnly((value) => !value);
                                setPress((p) => ({ title: 'Unread', count: p.count + 1 }));
                              },
                            },
                            { title: 'Flagged', icon: 'flag', disabled: true },
                            {
                              title: 'Delete All',
                              icon: 'trash',
                              destructive: true,
                              onPress: () =>
                                setPress((p) => ({ title: 'Delete All', count: p.count + 1 })),
                            },
                          ],
                        },
                      },
                    ],
                  }
                : undefined
            }>
            <ScrollView contentInsetAdjustmentBehavior="automatic">
              {/* The floating sidebar of iOS 26 covers the leading edge of this column. */}
              <SafeAreaView edges={['left']}>
                {MESSAGES.map((m) => (
                  <Pressable
                    key={m.id}
                    style={[
                      styles.message,
                      m.id === id && { backgroundColor: PlatformColor('systemGray5') },
                    ]}
                    onPress={() => {
                      router.replace(`/split-view-mail/${m.id}`);
                      splitRef.current?.show('secondary');
                    }}>
                    <Text style={styles.sender}>{m.sender}</Text>
                    <Text>{m.subject}</Text>
                  </Pressable>
                ))}
              </SafeAreaView>
            </ScrollView>
          </SplitView.Column>
        )}
        <SplitView.Content
          header={
            showHeaders
              ? {
                  ...backButton.options,
                  title: alternateTitles ? 'Message' : (message?.sender ?? 'Mail'),
                  leftToolbar: [
                    {
                      ...button('Unread', 'envelope.badge'),
                      selected: buttonStates,
                      badge: styledButtons ? { value: 3 } : undefined,
                    },
                  ],
                  rightToolbar: [
                    {
                      ...button('Search', 'magnifyingglass'),
                      tintColor: styledButtons ? 'orange' : undefined,
                      separateBackground: styledButtons,
                      accessibilityLabel: styledButtons ? 'Search messages' : undefined,
                    },
                    {
                      ...button('Move', 'folder'),
                      badge: styledButtons ? { style: { backgroundColor: 'green' } } : undefined,
                    },
                    { ...button('Archive', 'archivebox'), disabled: buttonStates },
                    {
                      ...button('Forward', 'arrowshape.turn.up.right'),
                      hidesSharedBackground: styledButtons,
                    },
                    {
                      ...button('Reply All', 'arrowshape.turn.up.left.2'),
                      variant: styledButtons ? 'prominent' : undefined,
                    },
                  ],
                }
              : undefined
          }
        />
        {showInspector && (
          <SplitView.Inspector
            header={
              showHeaders
                ? {
                    title: 'Info',
                    rightToolbar: [
                      { title: 'Close', icon: 'xmark', onPress: () => setShowInspector(false) },
                    ],
                  }
                : undefined
            }>
            <View style={styles.inspector}>
              <Text>Inspector</Text>
            </View>
          </SplitView.Inspector>
        )}
      </SplitView>
    </ToolbarPressContext>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  rowTitle: { fontSize: 17 },
  controls: { padding: 20, gap: 4 },
  link: { fontSize: 16, color: PlatformColor('link'), paddingVertical: 8 },
  sectionTitle: { fontSize: 13, color: 'gray', textTransform: 'uppercase' },
  message: { paddingHorizontal: 20, paddingVertical: 12, gap: 2 },
  sender: { fontSize: 17, fontWeight: '600' },
  inspector: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
