import AppMetrics, {
  type CrashReport,
  type LogRecord,
  type Metric,
  type Session,
} from 'expo-app-metrics';
import { useObserve } from 'expo-observe';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { CallStackTreeView } from '@/components/CallStackTreeView';
import { Chevron } from '@/components/Chevron';
import { CrashReportPanel } from '@/components/CrashReportPanel';
import { Divider } from '@/components/Divider';
import { JSONView } from '@/components/JSONView';
import { LogsPanel } from '@/components/LogsPanel';
import { MetricsFilter } from '@/components/MetricsFilter';
import { MetricsPanel } from '@/components/MetricsPanel';
import { SessionHeader } from '@/components/SessionHeader';
import { useTheme } from '@/utils/theme';

type SessionData = {
  metrics: Metric[];
  logs: LogRecord[];
  crashReport: CrashReport | null;
  isActive: boolean;
  endDate: string | null;
};

export default function SessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<SessionData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [selectedMetricNames, setSelectedMetricNames] = useState<Set<string>>(() => new Set());

  // If the route is reused with a different session id, drop the previous
  // session's state so it doesn't flash while the new fetch is in flight.
  // Plain refocus (same id) keeps showing the current content during refetch.
  useEffect(() => {
    setSession(null);
    setData(null);
    setLoaded(false);
  }, [id]);

  // Seed the selection to every distinct metric name once per session id, after
  // the lazy metrics have loaded. Keyed on `session?.id` so refocusing the tab
  // (which reloads sessions and creates new array references) doesn't wipe the
  // user's filter.
  useEffect(() => {
    if (!data) return;
    const names = new Set<string>();
    for (const metric of data.metrics) names.add(metric.name);
    setSelectedMetricNames(names);
  }, [session?.id, data == null]);

  const { markInteractive } = useObserve();
  useEffect(() => {
    setTimeout(() => {
      markInteractive();
    }, 100);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const sessions = await AppMetrics.getAllSessions();
        const found = sessions.find((s) => s.id === id) ?? null;
        if (cancelled) return;
        setSession(found);
        if (!found) {
          setData(null);
          setLoaded(true);
          return;
        }
        // Sessions are shared objects now — metrics, logs, the crash report,
        // and the live active/end-date state are all fetched lazily.
        const [metrics, logs, crashReport, isActive, endDate] = await Promise.all([
          found.getMetrics(),
          found.getLogs(),
          found.getCrashReport(),
          found.isActive(),
          found.getEndDate(),
        ]);
        if (cancelled) return;
        setData({ metrics, logs, crashReport, isActive, endDate });
        setLoaded(true);
      })();
      return () => {
        cancelled = true;
      };
    }, [id])
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.contentContainer}>
      <Stack.Screen options={{ title: id?.slice(0, 8) ?? 'Session' }} />
      {!loaded || (session && !data) ? null : session && data ? (
        <>
          <SessionHeader
            session={session}
            metrics={data.metrics}
            isActive={data.isActive}
            endDate={data.endDate}
          />
          <Divider style={styles.divider} />
          {data.crashReport ? (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text.default }]}>Crash report</Text>
              <CrashReportPanel report={data.crashReport} />
              {data.crashReport.callStackTree ? (
                <>
                  <Divider style={styles.divider} />
                  <Text style={[styles.sectionTitle, { color: theme.text.default }]}>
                    Call stacks
                  </Text>
                  <CallStackTreeView tree={data.crashReport.callStackTree} />
                </>
              ) : null}
              <Divider style={styles.divider} />
            </>
          ) : null}
          <Text style={[styles.sectionTitle, { color: theme.text.default }]}>Metrics</Text>
          <MetricsFilter
            metrics={data.metrics}
            selected={selectedMetricNames}
            onChange={setSelectedMetricNames}
          />
          <MetricsPanel metrics={data.metrics} filter={selectedMetricNames} />
          <Divider style={styles.divider} />
          <Text style={[styles.sectionTitle, { color: theme.text.default }]}>Log events</Text>
          <LogsPanel logs={data.logs} />
          <Divider style={styles.divider} />
          <Pressable
            onPress={() => setShowRawJson((v) => !v)}
            style={({ pressed }) => [
              styles.rawJsonHeader,
              showRawJson && styles.rawJsonHeaderExpanded,
              pressed && { opacity: 0.6 },
            ]}>
            <Text style={[styles.sectionTitle, styles.rawJsonTitle, { color: theme.text.default }]}>
              Raw JSON
            </Text>
            <Chevron expanded={showRawJson} />
          </Pressable>
          {showRawJson ? <JSONView value={buildRawSnapshot(session, data)} /> : null}
        </>
      ) : (
        <Text style={[styles.notFound, { color: theme.text.default }]}>Session not found</Text>
      )}
    </ScrollView>
  );
}

// Sessions are native shared objects whose properties live on the prototype, so spreading or
// stringifying one directly yields an empty object. Build a plain record from the eager
// properties plus the lazily-fetched data instead. The call stack tree balloons the raw JSON
// to the point where it can fail to render — it's already shown visually in the "Call stacks"
// section above, so we omit it and replace it with a marker noting that.
function buildRawSnapshot(session: Session, data: SessionData) {
  return {
    id: session.id,
    type: session.type,
    startDate: session.startDate,
    endDate: data.endDate,
    isActive: data.isActive,
    hasCrashReport: session.hasCrashReport,
    metrics: data.metrics,
    logs: data.logs,
    crashReport: data.crashReport?.callStackTree
      ? { ...data.crashReport, callStackTree: '<omitted, see Call stacks section>' as never }
      : data.crashReport,
  };
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  contentContainer: {
    paddingBottom: Platform.select({ ios: 30, android: 150 }),
  },
  notFound: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 16,
  },
  rawJsonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rawJsonTitle: {
    marginBottom: 0,
  },
  rawJsonHeaderExpanded: {
    marginBottom: 12,
  },
});
