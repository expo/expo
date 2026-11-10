import { createContext, use, type ReactNode } from 'react';
import { PlatformColor, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SplitNavigableColumn } from 'react-native-screens/experimental';

export type Column = 'sidebar' | 'supplementary' | 'content' | 'inspector';

export const COLUMN_NAMES: Record<Column, string> = {
  sidebar: 'Sidebar',
  supplementary: 'Supplementary',
  content: 'Content',
  inspector: 'Inspector',
};

const NAVIGABLE_COLUMNS: { column: Column; target: SplitNavigableColumn }[] = [
  { column: 'sidebar', target: 'primary' },
  { column: 'supplementary', target: 'supplementary' },
  { column: 'content', target: 'secondary' },
];

export const SplitViewTesterContext = createContext({
  show: (_column: SplitNavigableColumn) => {},
  hasSupplementary: true,
  collapsed: false,
  lastPress: 'None',
  lastSearchChange: 'None',
  lastSearchSubmit: 'None',
});

export function OptionButton({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityValue={value === undefined ? undefined : { text: value }}
      onPress={onPress}
      style={styles.button}>
      <Text style={styles.buttonLabel}>{label}</Text>
      {value !== undefined && <Text style={styles.buttonValue}>{value}</Text>}
    </Pressable>
  );
}

// Shows the status and navigation in every column, so a screenshot of any column shows the state.
export function ColumnScreen({ column, children }: { column: Column; children?: ReactNode }) {
  const { show, hasSupplementary, collapsed, lastPress, lastSearchChange, lastSearchSubmit } =
    use(SplitViewTesterContext);
  const insets = useSafeAreaInsets();
  const name = COLUMN_NAMES[column];
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.column}>
      <View style={styles.content}>
        <Text style={styles.title}>{name} column</Text>
        <Text>Split view: {collapsed ? 'collapsed' : 'expanded'}</Text>
        <Text>
          Reported insets: left {insets.left}, right {insets.right}
        </Text>
        <Text>Last toolbar press: {lastPress}</Text>
        <Text>Last search change: {lastSearchChange}</Text>
        <Text>Last search submit: {lastSearchSubmit}</Text>
        {NAVIGABLE_COLUMNS.filter(
          (target) =>
            target.column !== column && (hasSupplementary || target.column !== 'supplementary')
        ).map((target) => (
          <OptionButton
            key={target.column}
            label={`${name}: show ${COLUMN_NAMES[target.column].toLowerCase()} column`}
            onPress={() => show(target.target)}
          />
        ))}
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // The background shows where the horizontal safe area insets are applied.
  column: { backgroundColor: 'rgba(0, 122, 255, 0.1)' },
  content: { padding: 16, paddingBottom: 32, gap: 4 },
  title: { fontSize: 20, fontWeight: '600' },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 8,
  },
  buttonLabel: { fontSize: 16, color: PlatformColor('link'), flexShrink: 1 },
  buttonValue: { fontSize: 16, color: PlatformColor('secondaryLabel') },
});
