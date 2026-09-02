import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetView,
} from '@expo/ui/community/bottom-sheet';
import type { Metric } from 'expo-app-metrics';
import { useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Chevron } from '@/components/Chevron';
import { capitalize, categoryRank } from '@/utils/metricCategories';
import { useTheme } from '@/utils/theme';

type MetricsFilterProps = {
  metrics: Metric[];
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
};

export function MetricsFilter({ metrics, selected, onChange }: MetricsFilterProps) {
  const theme = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);

  const optionsByCategory = useMemo(() => buildOptionsByCategory(metrics), [metrics]);
  const allNames = useMemo(() => {
    const set = new Set<string>();
    for (const { names } of optionsByCategory) {
      for (const name of names) set.add(name);
    }
    return set;
  }, [optionsByCategory]);

  const totalCount = allNames.size;
  const selectedCount = selected.size;
  const summary =
    totalCount === 0
      ? 'No metrics'
      : selectedCount === totalCount
        ? `All ${totalCount} metrics types`
        : `${selectedCount} of ${totalCount} metrics types`;

  function open() {
    sheetRef.current?.present();
  }

  function toggle(name: string, value: boolean) {
    const next = new Set(selected);
    if (value) next.add(name);
    else next.delete(name);
    onChange(next);
  }

  return (
    <View>
      <Pressable
        onPress={open}
        disabled={totalCount === 0}
        style={({ pressed }) => [
          styles.pill,
          {
            backgroundColor: theme.background.element,
            borderColor: theme.border.default,
            opacity: pressed ? 0.6 : 1,
          },
        ]}>
        <Text style={[styles.pillLabel, { color: theme.text.default }]}>{summary}</Text>
        <Chevron expanded={false} size={14} color={theme.text.tertiary} animated={false} />
      </Pressable>

      <BottomSheetModal
        ref={sheetRef}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: theme.background.screen }}>
        <BottomSheetView style={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: theme.text.default }]}>Filter metrics</Text>

          <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetScrollContent}>
            {optionsByCategory.map(({ category, names }) => (
              <View key={category} style={styles.categorySection}>
                <Text style={[styles.categoryHeader, { color: theme.text.tertiary }]}>
                  {capitalize(category).toUpperCase()}
                </Text>
                {names.map((name) => {
                  const checked = selected.has(name);
                  return (
                    <Pressable
                      key={name}
                      onPress={() => toggle(name, !checked)}
                      style={({ pressed }) => [styles.checkRow, pressed && { opacity: 0.6 }]}>
                      <Ionicons
                        name={checked ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={checked ? theme.button.primary.background : theme.text.tertiary}
                      />
                      <Text style={[styles.checkLabel, { color: theme.text.default }]}>{name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.border.default }]}>
            <Pressable
              onPress={() => onChange(new Set())}
              style={({ pressed }) => [styles.footerLink, pressed && { opacity: 0.6 }]}>
              <Text style={[styles.footerLinkLabel, { color: theme.text.default }]}>Clear</Text>
            </Pressable>
            <Pressable
              onPress={() => onChange(new Set(allNames))}
              style={({ pressed }) => [styles.footerLink, pressed && { opacity: 0.6 }]}>
              <Text style={[styles.footerLinkLabel, { color: theme.text.default }]}>Select all</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

function buildOptionsByCategory(metrics: Metric[]): { category: string; names: string[] }[] {
  const map = new Map<string, Set<string>>();
  for (const metric of metrics) {
    let set = map.get(metric.category);
    if (!set) {
      set = new Set<string>();
      map.set(metric.category, set);
    }
    set.add(metric.name);
  }
  return Array.from(map.entries())
    .map(([category, names]) => ({ category, names: Array.from(names) }))
    .sort(
      (a, b) =>
        categoryRank(a.category) - categoryRank(b.category) || a.category.localeCompare(b.category)
    );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  pillLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingBottom: 16,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  checkLabel: {
    fontSize: 15,
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  footerLink: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  footerLinkLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
