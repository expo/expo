import AppMetrics, {
  type CrashReport,
  type DebugSession,
  type Session,
  type SessionType,
} from 'expo-app-metrics';
import { useObserve } from 'expo-observe';
import { type Href, router, Stack, useFocusEffect } from 'expo-router';
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

// A row's worth of session data, normalized from a `Session` record — the live
// main session or an inactive one.
type SessionRowData = {
  kind: 'session';
  id: string;
  type: SessionType;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  metricCount: number;
  crashed: boolean;
  // Detail route: the live sessions have dedicated `main`/`foreground` screens;
  // inactive ones are looked up by id via the `[id]` screen.
  href: Href;
};

// A startup crash not attributed to any session — the orphans (`sessionId` null)
// among `getAllCrashReports`. Keyed by position since crash reports have no id;
// the detail screen re-fetches the same ordered list and looks the report up by index.
type OrphanRowData = {
  kind: 'orphan';
  index: number;
  summary: string;
  timestamp: string;
  href: Href;
};

type RowData = SessionRowData | OrphanRowData;

type Section = { title: string; data: RowData[] };

export default function SessionsList() {
  const theme = useTheme();
  const [sections, setSections] = useState<Section[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { markInteractive } = useObserve();
  useEffect(() => {
    setTimeout(() => {
      markInteractive();
    }, 100);
  }, []);

  const refresh = useCallback(async () => {
    const live = await Promise.all([
      AppMetrics.getMainSession(),
      AppMetrics.getForegroundSession(),
    ]);
    const active = await Promise.all(
      live.filter((session): session is Session => session != null).map(liveSessionToRow)
    );

    const records = await AppMetrics.getInactiveSessions();
    const inactive: SessionRowData[] = records
      .map(inactiveSessionToRow)
      .sort((a, b) => (a.startDate < b.startDate ? 1 : -1));

    // Startup crashes that predate any session — the orphans among all reports.
    // Android only, hence the optional call.
    const allReports = (await AppMetrics.getAllCrashReports?.()) ?? [];
    const orphans: OrphanRowData[] = allReports
      .filter((report) => report.sessionId == null)
      .map(orphanCrashToRow);

    setSections([
      ...(active.length ? [{ title: 'Active', data: active }] : []),
      ...(inactive.length ? [{ title: 'Inactive', data: inactive }] : []),
      ...(orphans.length ? [{ title: 'Startup crashes', data: orphans }] : []),
    ]);
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

  if (typeof AppMetrics.getInactiveSessions !== 'function') {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background.screen }]}>
        <Text style={[styles.emptyText, { color: theme.text.default }]}>
          Sessions are not implemented on this platform yet
        </Text>
      </View>
    );
  }

  const total = sections.reduce((sum, section) => sum + section.data.length, 0);
  const title = total > 0 ? `Sessions (${total})` : 'Sessions';

  return (
    <>
      <Stack.Screen options={{ title }} />
      <SectionList
        style={[styles.container, { backgroundColor: theme.background.screen }]}
        contentContainerStyle={styles.contentContainer}
        sections={sections}
        keyExtractor={(item) => (item.kind === 'orphan' ? `orphan-${item.index}` : item.id)}
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
        renderItem={({ item }) =>
          item.kind === 'orphan' ? <OrphanRow row={item} /> : <SessionRow session={item} />
        }
      />
    </>
  );
}

async function liveSessionToRow(session: Session): Promise<SessionRowData> {
  return {
    kind: 'session',
    id: session.id,
    type: session.type,
    startDate: session.startDate,
    endDate: null,
    isActive: true,
    metricCount: (await session.getMetrics()).length,
    crashed: false,
    href: `/sessions/${session.type}`,
  };
}

function inactiveSessionToRow(session: DebugSession): SessionRowData {
  return {
    kind: 'session',
    id: session.id,
    type: session.type,
    startDate: session.startDate,
    endDate: session.endDate ?? null,
    isActive: false,
    metricCount: session.metrics.length,
    crashed: !!session.crashReport,
    href: `/sessions/${session.id}`,
  };
}

function orphanCrashToRow(report: CrashReport, index: number): OrphanRowData {
  return {
    kind: 'orphan',
    index,
    summary: crashSummary(report),
    timestamp: report.timestampBegin,
    href: `/sessions/orphaned/${index}`,
  };
}

// A short one-line description of a crash. Android JVM crashes carry the throwable
// message as a plain `exceptionReason` string; native crashes fall back to the signal.
function crashSummary(report: CrashReport): string {
  const reason = report.exceptionReason;
  if (typeof reason === 'string' && reason.trim()) {
    return reason.split('\n')[0];
  }
  if (reason && typeof reason === 'object') {
    return reason.composedMessage || reason.exceptionName;
  }
  return report.terminationReason ?? 'Native crash';
}

function SessionRow({ session }: { session: SessionRowData }) {
  const theme = useTheme();
  const { metricCount, isActive } = session;
  const startDate = new Date(session.startDate);
  const endDate = session.endDate ? new Date(session.endDate) : null;
  const duration = endDate ? formatDuration(endDate.getTime() - startDate.getTime()) : null;
  const shortId = session.id.slice(0, 8);

  return (
    <Pressable
      onPress={() => router.push(session.href)}
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
          {session.crashed ? (
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
        {duration ? ` · ${duration}` : isActive ? ' · active' : ''} · {metricCount} metric
        {metricCount === 1 ? '' : 's'}
      </Text>
    </Pressable>
  );
}

function OrphanRow({ row }: { row: OrphanRowData }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push(row.href)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.background.element,
          borderColor: theme.border.default,
          borderLeftWidth: 3,
          borderLeftColor: theme.icon.danger,
        },
        pressed && styles.rowPressed,
      ]}>
      <View style={styles.rowHeader}>
        <Text
          style={[styles.rowTitle, { color: theme.text.default }]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {formatDate(new Date(row.timestamp))}
        </Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: theme.background.danger }]}>
            <Text style={[styles.badgeText, { color: theme.text.danger }]}>Crashed</Text>
          </View>
        </View>
      </View>
      <Text
        style={[styles.rowMeta, { color: theme.text.secondary }]}
        numberOfLines={2}
        ellipsizeMode="tail">
        {row.summary}
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
