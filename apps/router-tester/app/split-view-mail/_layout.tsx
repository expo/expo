import { Link, useGlobalSearchParams } from 'expo-router';
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
  // Navigation does not reveal a column, so the selected column is shown with the split view commands.
  const splitRef = useRef<ComponentRef<typeof SplitView>>(null);
  const [collapsed, setCollapsed] = useState(false);
  const { id } = useGlobalSearchParams<{ id?: string }>();

  const [showHeaders, setShowHeaders] = useState(true);
  const [alternateTitles, setAlternateTitles] = useState(false);
  const [largeTitle, setLargeTitle] = useState(true);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [titleColors, setTitleColors] = useState(false);
  const [iconButtons, setIconButtons] = useState(true);
  const [threeColumns, setThreeColumns] = useState(true);
  const [showInspector, setShowInspector] = useState(false);
  const [press, setPress] = useState({ title: '', count: 0 });
  const [disabledArchive, setDisabledArchive] = useState(false);
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
  const messagesLeadingItems = [
    { ...button('Archive', 'archivebox'), disabled: disabledArchive },
    {
      ...button('Reply All', 'arrowshape.turn.up.left.2'),
      variant: styledButtons ? ('prominent' as const) : undefined,
      tintColor: styledButtons ? 'orange' : undefined,
      hidesSharedBackground: styledButtons,
    },
  ];
  const pressLabel = press.count ? `${press.title} (${press.count})` : 'None';

  return (
    <ToolbarPressContext value={pressLabel}>
      <SplitView
        ref={splitRef}
        preferredDisplayMode="twoBesideSecondary"
        topColumnForCollapsing={threeColumns ? 'supplementary' : 'primary'}
        showInspector={showInspector}
        onInspectorHide={() => setShowInspector(false)}
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
              <Link
                key={mailbox.name}
                href="/split-view-mail"
                asChild
                onPress={() => {
                  // When expanded, `show` would close the sidebar overlay.
                  if (collapsed && threeColumns) splitRef.current?.show('supplementary');
                }}>
                <Pressable style={styles.row}>
                  <SymbolView name={mailbox.icon} size={20} />
                  <Text style={styles.rowTitle}>{mailbox.name}</Text>
                </Pressable>
              </Link>
            ))}
            <View style={styles.controls}>
              <Text style={styles.sectionTitle}>Test cases</Text>
              <Link testID="split-view-mail-home" href="/" replace style={styles.link}>
                Back to home
              </Link>
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
                label="Disabled Archive"
                testID="split-view-mail-disabled-archive"
                value={disabledArchive}
                onValueChange={setDisabledArchive}
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
                      leadingItems: messagesLeadingItems,
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
                <Link
                  key={m.id}
                  href={`/split-view-mail/${m.id}`}
                  // screens v5 cannot replace the root screen of a stack, so the first message is pushed.
                  push={!id}
                  replace={!!id}
                  asChild
                  onPress={() => splitRef.current?.show('secondary')}>
                  <Pressable
                    style={StyleSheet.flatten([
                      styles.message,
                      m.id === id && { backgroundColor: PlatformColor('systemGray5') },
                    ])}>
                    <Text style={styles.sender}>{m.sender}</Text>
                    <Text>{m.subject}</Text>
                  </Pressable>
                </Link>
              ))}
            </ScrollView>
          </SplitView.Column>
        )}
        <SplitView.Content stackIntegration />
        <SplitView.Inspector>
          <View style={styles.inspector}>
            <Text>Inspector</Text>
          </View>
        </SplitView.Inspector>
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
