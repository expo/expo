import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { PlatformColor, Pressable, StyleSheet, Text, View } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

type SettingsSection = {
  id: string;
  title: string;
  icon: SFSymbol;
  color: string;
  value?: string;
  // Rows of the detail page, in groups.
  groups?: string[][];
};

export const SECTION_GROUPS: SettingsSection[][] = [
  [
    { id: 'wifi', title: 'Wi-Fi', icon: 'wifi', color: 'systemBlue', value: 'Home' },
    {
      id: 'bluetooth',
      title: 'Bluetooth',
      icon: 'dot.radiowaves.left.and.right',
      color: 'systemBlue',
      value: 'On',
    },
    {
      id: 'cellular',
      title: 'Cellular Data',
      icon: 'antenna.radiowaves.left.and.right',
      color: 'systemGreen',
    },
  ],
  [
    {
      id: 'general',
      title: 'General',
      icon: 'gear',
      color: 'systemGray',
      groups: [
        ['About', 'Software Update'],
        ['AirDrop', 'Continuity'],
        ['Background App Refresh', 'Date & Time', 'Keyboard', 'Fonts', 'Language & Region'],
        ['VPN & Device Management'],
        ['Transfer or Reset', 'Shut Down'],
      ],
    },
    { id: 'accessibility', title: 'Accessibility', icon: 'accessibility', color: 'systemBlue' },
    { id: 'camera', title: 'Camera', icon: 'camera.fill', color: 'systemGray' },
    { id: 'control-center', title: 'Control Center', icon: 'switch.2', color: 'systemGray' },
    {
      id: 'display',
      title: 'Display & Brightness',
      icon: 'sun.max.fill',
      color: 'systemBlue',
      groups: [['Light', 'Dark', 'Automatic'], ['Text Size', 'Bold Text'], ['Night Shift']],
    },
    { id: 'home-screen', title: 'Home Screen', icon: 'apps.iphone', color: 'systemIndigo' },
    { id: 'search', title: 'Search', icon: 'magnifyingglass', color: 'systemGray' },
    { id: 'wallpaper', title: 'Wallpaper', icon: 'sparkles', color: 'systemCyan' },
  ],
  [
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'bell.badge.fill',
      color: 'systemRed',
      groups: [['Show Previews', 'Screen Sharing'], ['Scheduled Summary']],
    },
    { id: 'sounds', title: 'Sounds', icon: 'speaker.wave.3.fill', color: 'systemPink' },
    { id: 'focus', title: 'Focus', icon: 'moon.fill', color: 'systemIndigo' },
    { id: 'screen-time', title: 'Screen Time', icon: 'hourglass', color: 'systemIndigo' },
  ],
  [
    { id: 'passcode', title: 'Face ID & Passcode', icon: 'faceid', color: 'systemGreen' },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: 'hand.raised.fill',
      color: 'systemBlue',
    },
    { id: 'battery', title: 'Battery', icon: 'battery.100percent', color: 'systemGreen' },
  ],
];

export const ACCOUNT: SettingsSection = {
  id: 'account',
  title: 'Jane Doe',
  icon: 'person.crop.circle.fill',
  color: 'systemGray',
  groups: [['Personal Information', 'Sign-In & Security', 'Payment & Shipping'], ['Sign Out']],
};

const SECTIONS = [ACCOUNT, ...SECTION_GROUPS.flat()];

export function findSection(id: string) {
  return SECTIONS.find((section) => section.id === id);
}

export function sectionGroups(section: SettingsSection) {
  return section.groups ?? [];
}

export function SettingsIcon({ icon, color }: Pick<SettingsSection, 'icon' | 'color'>) {
  return (
    <View style={[styles.icon, { backgroundColor: PlatformColor(color) }]}>
      <SymbolView name={icon} size={18} tintColor="white" />
    </View>
  );
}

// A rounded group of rows, as in the grouped table views of the Settings app.
export function SettingsGroup({ children }: { children: ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

type RowProps = {
  title: string;
  value?: string;
  icon?: ReactNode;
  accessory?: ReactNode;
  chevron?: boolean;
  selected?: boolean;
  onPress?: () => void;
};

export function SettingsRow({
  title,
  value,
  icon,
  accessory,
  chevron,
  selected,
  onPress,
}: RowProps) {
  const content = (
    <>
      {icon}
      <Text style={[styles.title, selected && styles.selectedText]} numberOfLines={1}>
        {title}
      </Text>
      {value !== undefined && (
        <Text style={[styles.value, selected && styles.selectedText]}>{value}</Text>
      )}
      {accessory}
      {chevron && (
        <SymbolView
          name="chevron.right"
          size={13}
          weight="semibold"
          tintColor={PlatformColor('tertiaryLabel')}
        />
      )}
    </>
  );
  // A row without `onPress` is not a button, so VoiceOver reaches its switch directly.
  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={selected ? { selected } : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.selectedRow,
        pressed && !selected && styles.pressedRow,
      ]}>
      {content}
    </Pressable>
  );
}

export const settingsStyles = StyleSheet.create({
  screen: { backgroundColor: PlatformColor('systemGroupedBackground') },
  content: { padding: 16, gap: 24 },
});

const styles = StyleSheet.create({
  icon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: {
    backgroundColor: PlatformColor('secondarySystemGroupedBackground'),
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pressedRow: { backgroundColor: PlatformColor('systemGray4') },
  selectedRow: { backgroundColor: PlatformColor('systemBlue') },
  title: { flex: 1, fontSize: 17, color: PlatformColor('label') },
  value: { fontSize: 17, color: PlatformColor('secondaryLabel') },
  selectedText: { color: 'white' },
});
