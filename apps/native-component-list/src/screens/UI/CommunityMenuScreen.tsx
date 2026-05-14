import { Icon } from '@expo/ui';
import {
  MenuView,
  type MenuAction,
  type MenuComponentRef,
  type NativeActionEvent,
} from '@expo/ui/community/menu';
import * as React from 'react';
import { Button, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScrollPage, Section } from '../../components/Page';

const EDIT = Icon.select({
  ios: 'pencil',
  android: import('@expo/material-symbols/edit.xml'),
});
const COPY = Icon.select({
  ios: 'doc.on.doc',
  android: import('@expo/material-symbols/file_copy.xml'),
});
const LOCK = Icon.select({
  ios: 'lock',
  android: import('@expo/material-symbols/lock.xml'),
});
const DELETE = Icon.select({
  ios: 'trash',
  android: import('@expo/material-symbols/delete.xml'),
});
const PIN = Icon.select({
  ios: 'pin',
  android: import('@expo/material-symbols/pin.xml'),
});
const CHECK_CIRCLE = Icon.select({
  ios: 'checkmark.circle',
  android: import('@expo/material-symbols/check_circle.xml'),
});
const SORT = Icon.select({
  ios: 'arrow.up.arrow.down',
  android: import('@expo/material-symbols/swap_vert.xml'),
});
const WIFI = Icon.select({
  ios: 'wifi',
  android: import('@expo/material-symbols/wifi.xml'),
});
const MAIL = Icon.select({
  ios: 'message',
  android: import('@expo/material-symbols/mail.xml'),
});

const TriggerView = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.trigger}>
    <Text style={styles.triggerText}>{children}</Text>
  </View>
);

export default function CommunityMenuScreen() {
  const [lastEvent, setLastEvent] = React.useState<string>('—');
  const [pinned, setPinned] = React.useState(false);
  const [showCompleted, setShowCompleted] = React.useState(true);
  const [openCount, setOpenCount] = React.useState(0);
  const [closeCount, setCloseCount] = React.useState(0);
  const menuRef = React.useRef<MenuComponentRef>(null);

  const basicActions: MenuAction[] = [
    { id: 'edit', title: 'Edit', image: EDIT },
    { id: 'duplicate', title: 'Duplicate', image: COPY },
    {
      id: 'locked',
      title: 'Locked action',
      image: LOCK,
      attributes: { disabled: true },
    },
    {
      id: 'delete',
      title: 'Delete',
      image: DELETE,
      attributes: { destructive: true },
    },
  ];

  const stateActions: MenuAction[] = [
    {
      id: 'pinned',
      title: 'Pin',
      image: PIN,
      state: pinned ? 'on' : 'off',
    },
    {
      id: 'completed',
      title: 'Show completed',
      image: CHECK_CIRCLE,
      state: showCompleted ? 'on' : 'off',
    },
    {
      id: 'state-disabled',
      title: 'Disabled toggle (must not fire)',
      image: LOCK,
      state: 'on',
      attributes: { disabled: true },
    },
  ];

  const colorfulActions: MenuAction[] = [
    {
      id: 'colored-edit',
      title: 'Edit (purple)',
      image: EDIT,
      imageColor: '#7c3aed',
      titleColor: '#7c3aed',
    },
    {
      id: 'colored-copy',
      title: 'Duplicate (orange icon on Android)',
      image: COPY,
      imageColor: '#ea580c',
    },
    {
      id: 'colored-title',
      title: 'Title only (green on Android)',
      titleColor: '#16a34a',
    },
  ];

  const hiddenActions: MenuAction[] = [
    { id: 'visible', title: 'Visible', image: EDIT },
    { id: 'phantom', title: 'Phantom (never rendered)', attributes: { hidden: true } },
    { id: 'also-visible', title: 'Also visible', image: COPY },
  ];

  const subactionsActions: MenuAction[] = [
    { id: 'rename', title: 'Rename', image: EDIT },
    {
      id: 'sort',
      title: 'Sort by',
      image: SORT,
      subactions: [
        { id: 'sort-name', title: 'Name' },
        { id: 'sort-date', title: 'Date' },
        { id: 'sort-size', title: 'Size' },
      ],
    },
    {
      id: 'share-section',
      title: 'Share',
      displayInline: true,
      subactions: [
        { id: 'share-airdrop', title: 'AirDrop', image: WIFI },
        { id: 'share-message', title: 'Message', image: MAIL },
      ],
    },
  ];

  const onPressAction = (e: NativeActionEvent) => {
    setLastEvent(e.nativeEvent.event);
    if (e.nativeEvent.event === 'pinned') setPinned((p) => !p);
    if (e.nativeEvent.event === 'completed') setShowCompleted((c) => !c);
  };

  return (
    <ScrollPage>
      <Section title="Last event">
        <Text>{lastEvent}</Text>
      </Section>

      <Section title="Tap (default)">
        <MenuView actions={basicActions} onPressAction={onPressAction}>
          <TriggerView>Tap me</TriggerView>
        </MenuView>
      </Section>

      <Section title="Long-press">
        <MenuView actions={basicActions} onPressAction={onPressAction} shouldOpenOnLongPress>
          <TriggerView>Long-press me</TriggerView>
        </MenuView>
      </Section>

      <Section title="State (checkmarks)">
        <MenuView actions={stateActions} onPressAction={onPressAction}>
          <TriggerView>{`Pin: ${pinned ? 'on' : 'off'} · Completed: ${showCompleted ? 'on' : 'off'}`}</TriggerView>
        </MenuView>
      </Section>

      <Section title="Subactions and inline section">
        <MenuView actions={subactionsActions} onPressAction={onPressAction}>
          <TriggerView>Tap me</TriggerView>
        </MenuView>
      </Section>

      <Section title="With menu title (iOS)">
        <MenuView title="Choose action" actions={basicActions} onPressAction={onPressAction}>
          <TriggerView>Tap me</TriggerView>
        </MenuView>
      </Section>

      <Section title="Pressable as trigger">
        <MenuView actions={basicActions} onPressAction={onPressAction}>
          <Pressable style={({ pressed }) => [styles.trigger, pressed && { opacity: 0.6 }]}>
            <Text style={styles.triggerText}>Pressable trigger</Text>
          </Pressable>
        </MenuView>
      </Section>

      <Section title="imageColor / titleColor">
        <MenuView actions={colorfulActions} onPressAction={onPressAction} testID="colorful-menu">
          <TriggerView>Tap for colored items</TriggerView>
        </MenuView>
      </Section>

      <Section title="hidden attribute (middle item omitted)">
        <MenuView actions={hiddenActions} onPressAction={onPressAction}>
          <TriggerView>Tap me</TriggerView>
        </MenuView>
      </Section>

      <Section title="onOpenMenu / onCloseMenu (Android)">
        <Text>{`opens: ${openCount} · closes: ${closeCount}`}</Text>
        <MenuView
          actions={basicActions}
          onPressAction={onPressAction}
          onOpenMenu={() => setOpenCount((n) => n + 1)}
          onCloseMenu={() => setCloseCount((n) => n + 1)}>
          <TriggerView>Tap (watch counters)</TriggerView>
        </MenuView>
      </Section>

      <Section title="Imperative ref.show() (Android)">
        <MenuView ref={menuRef} actions={basicActions} onPressAction={onPressAction}>
          <TriggerView>Anchor for ref.show()</TriggerView>
        </MenuView>
        <Button title="Open via ref.show()" onPress={() => menuRef.current?.show()} />
      </Section>
      <View style={styles.bottomSpacer} />
    </ScrollPage>
  );
}

CommunityMenuScreen.navigationOptions = {
  title: 'Community Menu',
};

const styles = StyleSheet.create({
  trigger: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  triggerText: {
    fontSize: 16,
    color: '#1e3a8a',
  },
  bottomSpacer: {
    height: 48,
  },
});
