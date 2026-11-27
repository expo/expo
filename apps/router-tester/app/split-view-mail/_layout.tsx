import { useGlobalSearchParams, useRouter } from 'expo-router';
import { SplitView, type SplitViewHeader } from 'expo-router/unstable-split-view';
import { SymbolView } from 'expo-symbols';
import { type ComponentRef, useRef, useState } from 'react';
import { PlatformColor, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

type HeaderItems = NonNullable<NonNullable<SplitViewHeader['ios']>['trailingItems']>;
type HeaderButton = Extract<HeaderItems[number], { type: 'item'; title?: string }>;

export default function Layout() {
  const router = useRouter();
  // Navigation does not reveal a column, so the selected column is shown with the split view commands.
  const splitRef = useRef<ComponentRef<typeof SplitView>>(null);
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
  const [buttonStates, setButtonStates] = useState(false);
  const [styledButtons, setStyledButtons] = useState(false);

  const button = (title: string, icon?: SFSymbol): HeaderButton => ({
    type: 'item',
    id: title,
    title,
    icon: iconButtons && icon ? { type: 'sfSymbol', name: icon } : undefined,
    onPress: () => setPress((p) => ({ title, count: p.count + 1 })),
  });
  const appearance = titleColors
    ? { titleFontColor: 'red', largeTitleFontColor: 'blue' }
    : undefined;
  const mailboxesHeader = {
    largeTitleEnabled: largeTitle,
    standardAppearance: appearance,
    scrollEdgeAppearance: appearance,
    trailingItems: [button('Edit')],
  };
  const messageHeader = {
    leadingItems: [button('Unread', 'envelope.badge')],
    trailingItems: [
      {
        ...button('Search', 'magnifyingglass'),
        tintColor: styledButtons ? 'orange' : undefined,
      },
      button('Move', 'folder'),
      { ...button('Archive', 'archivebox'), disabled: buttonStates },
      {
        ...button('Forward', 'arrowshape.turn.up.right'),
        hidesSharedBackground: styledButtons,
      },
      {
        ...button('Reply All', 'arrowshape.turn.up.left.2'),
        variant: styledButtons ? ('prominent' as const) : undefined,
      },
    ],
  };
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
                  ios: mailboxesHeader,
                }
              : undefined
          }>
          <ScrollView contentInsetAdjustmentBehavior="automatic">
            {MAILBOXES.map((mailbox) => (
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
                onValueChange={setShowHeaders}
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
                label="Disable Archive button"
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
                    title: alternateTitles ? 'Gmail' : 'Inbox Gmail',
                    ios: {
                      trailingItems: [
                        {
                          type: 'item',
                          id: 'filter',
                          title: 'Filter',
                          icon: iconButtons
                            ? { type: 'sfSymbol', name: 'line.3.horizontal.decrease.circle' }
                            : undefined,
                          menu: {
                            type: 'menu',
                            id: 'filter-menu',
                            title: 'Filter by',
                            children: [
                              {
                                type: 'menuItem',
                                id: 'Unread',
                                title: 'Unread',
                                icon: { type: 'sfSymbol', name: 'envelope.badge' },
                                itemType: 'toggle',
                              },
                              {
                                type: 'menuItem',
                                id: 'Flagged',
                                title: 'Flagged',
                                icon: { type: 'sfSymbol', name: 'flag' },
                                itemType: 'toggle',
                              },
                            ],
                            onSelectionChange: (selectedIds) => {
                              setPress((p) => ({
                                title: selectedIds.length ? selectedIds.join(', ') : 'Clear filter',
                                count: p.count + 1,
                              }));
                            },
                          },
                        },
                      ],
                    },
                  }
                : undefined
            }>
            <ScrollView contentInsetAdjustmentBehavior="automatic">
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
            </ScrollView>
          </SplitView.Column>
        )}
        <SplitView.Content
          header={
            showHeaders
              ? {
                  title: alternateTitles ? 'Message' : (message?.sender ?? 'Mail'),
                  ios: messageHeader,
                }
              : undefined
          }
        />
        {showInspector && (
          <SplitView.Inspector>
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
