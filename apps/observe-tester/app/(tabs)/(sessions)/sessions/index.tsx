import AppMetrics, { type Session } from 'expo-app-metrics';
import { useObserve } from 'expo-observe';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTheme } from '@/utils/theme';

export default function SessionsList() {
  const theme = useTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const currentMainStart = sessions.find((s) => s.type === 'main')?.startDate;
  const isActive = (s: Session) =>
    !s.endDate && currentMainStart != null && s.startDate >= currentMainStart;

  const { markInteractive } = useObserve();
  useEffect(() => {
    setTimeout(() => {
      markInteractive();
    }, 100);
  }, []);

  const refresh = useCallback(async () => {
    const result = await AppMetrics.getAllSessions();
    const sorted = [...result].sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
    setSessions(sorted);
    setLoaded(true);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (typeof AppMetrics.getAllSessions !== 'function') {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background.screen }]}>
        <Text style={[styles.emptyText, { color: theme.text.default }]}>
          Sessions are not implemented on this platform yet
        </Text>
      </View>
    );
  }

  const sections = groupByDay(sessions);

  const title = sessions.length > 0 ? `Sessions (${sessions.length})` : 'Sessions';

  return (
    <>
      <Stack.Screen options={{ title }} />
      <SectionList
        style={[styles.container, { backgroundColor: theme.background.screen }]}
        contentContainerStyle={styles.contentContainer}
        sections={sections}
        keyExtractor={(session) => session.id}
        stickySectionHeadersEnabled={false}
        refreshControl={
          Platform.OS === 'ios' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.text.secondary}
            />
          ) : undefined
        }
        ListEmptyComponent={
          loaded ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.text.default }]}>No sessions yet</Text>
              <Text style={[styles.emptyHint, { color: theme.text.secondary }]}>
                Sessions are recorded as you use the app. Crashes from past launches show up here
                once MetricKit delivers them.
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <ActivityIndicator color={theme.text.secondary} />
            </View>
          )
        }
        renderSectionHeader={({ section }) => (
          <Text
            style={[
              styles.sectionHeader,
              section !== sections[0] && styles.sectionHeaderSpaced,
              { color: theme.text.default },
            ]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => <SessionRow session={item} isActive={isActive(item)} />}
      />
    </>
  );
}

function groupByDay(sessions: Session[]): { title: string; data: Session[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sectionsByKey = new Map<string, { title: string; data: Session[] }>();
  for (const session of sessions) {
    const date = new Date(session.startDate);
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);

    let title: string;
    if (day.getTime() === today.getTime()) {
      title = 'Today';
    } else if (day.getTime() === yesterday.getTime()) {
      title = 'Yesterday';
    } else {
      title = sectionDateFormatter.format(date);
    }

    const key = day.toISOString();
    const existing = sectionsByKey.get(key);
    if (existing) {
      existing.data.push(session);
    } else {
      sectionsByKey.set(key, { title, data: [session] });
    }
  }
  return Array.from(sectionsByKey.values());
}

function SessionRow({ session, isActive }: { session: Session; isActive: boolean }) {
  const theme = useTheme();
  const startDate = new Date(session.startDate);
  const endDate = session.endDate ? new Date(session.endDate) : null;
  const duration = endDate ? formatDuration(endDate.getTime() - startDate.getTime()) : null;
  const shortId = session.id.slice(0, 8);

  return (
    <Pressable
      onPress={() => router.push(`/sessions/${session.id}`)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.background.element,
          borderColor: theme.border.default,
        },
        isActive && {
          borderLeftWidth: 3,
          borderLeftColor: theme.icon.success,
        },
        pressed && styles.rowPressed,
      ]}>
      <View style={styles.rowHeader}>
        <Text
          style={[styles.rowTitle, { color: theme.text.default }]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {formatDate(startDate)}
        </Text>
        <View style={styles.badges}>
          {session.type === 'main' && session.crashReport ? (
            <View style={[styles.badge, { backgroundColor: theme.background.danger }]}>
              <Text style={[styles.badgeText, { color: theme.text.danger }]}>Crashed</Text>
            </View>
          ) : null}
          <View style={[styles.badge, { backgroundColor: theme.background.info }]}>
            <Text style={[styles.badgeText, { color: theme.text.info }]}>
              {capitalize(session.type)}
            </Text>
          </View>
        </View>
      </View>
      <Text
        style={[styles.rowMeta, { color: theme.text.secondary }]}
        numberOfLines={1}
        ellipsizeMode="tail">
        {shortId}
        {duration ? ` · ${duration}` : isActive ? ' · active' : ''} · {session.metrics.length}{' '}
        metric{session.metrics.length === 1 ? '' : 's'}
      </Text>
    </Pressable>
  );
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const sectionDateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Renders a duration with the two largest non-zero units (e.g. "2h 5m", "45s", "3d").
function formatDuration(ms: number) {
  const totalSeconds = Math.round(ms / 1000);
  const units = [
    { value: Math.floor(totalSeconds / 86400), suffix: 'd' },
    { value: Math.floor((totalSeconds % 86400) / 3600), suffix: 'h' },
    { value: Math.floor((totalSeconds % 3600) / 60), suffix: 'm' },
    { value: totalSeconds % 60, suffix: 's' },
  ];
  const firstNonZero = units.findIndex((u) => u.value > 0);
  if (firstNonZero === -1) {
    return '0s';
  }
  const parts = units
    .slice(firstNonZero, firstNonZero + 2)
    .filter((u) => u.value > 0)
    .map((u) => `${u.value}${u.suffix}`);
  return parts.join(' ');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: Platform.select({ ios: 30, android: 150 }),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 13,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  sectionHeaderSpaced: {
    marginTop: 16,
  },
  row: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    flexShrink: 1,
  },
  rowMeta: {
    fontSize: 13,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
});
