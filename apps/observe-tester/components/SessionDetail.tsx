import type { DebugSession, Session } from 'expo-app-metrics';
import { useObserve } from 'expo-observe';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
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

/**
 * Presentational session detail screen. Renders a resolved `Session` record
 * (or loading / not-found states). The data loading is the caller's
 * responsibility — the `main` and `[id]` routes each fetch from their own
 * source and hand the result here.
 */
export function SessionDetail({
  session,
  loaded,
  title,
}: {
  session: DebugSession | null;
  loaded: boolean;
  title: string;
}) {
  const theme = useTheme();
  const [showRawJson, setShowRawJson] = useState(false);
  const [selectedMetricNames, setSelectedMetricNames] = useState<Set<string>>(() => new Set());

  // Seed the selection to every distinct metric name once per session id. Keyed on `session?.id`
  // so refocusing the tab (which reloads sessions and creates a new metrics array reference)
  // doesn't wipe the user's filter.
  useEffect(() => {
    if (!session) return;
    const names = new Set<string>();
    for (const metric of session.metrics) names.add(metric.name);
    setSelectedMetricNames(names);
  }, [session?.id]);

  const { markInteractive } = useObserve();
  useEffect(() => {
    setTimeout(() => {
      markInteractive();
    }, 100);
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.contentContainer}>
      <Stack.Screen options={{ title }} />
      {!loaded ? null : session ? (
        <>
          <SessionHeader session={session} />
          <Divider style={styles.divider} />
          {session.crashReport ? (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text.default }]}>Crash report</Text>
              <CrashReportPanel report={session.crashReport} />
              {session.crashReport.callStackTree ? (
                <>
                  <Divider style={styles.divider} />
                  <Text style={[styles.sectionTitle, { color: theme.text.default }]}>
                    Call stacks
                  </Text>
                  <CallStackTreeView tree={session.crashReport.callStackTree} />
                </>
              ) : null}
              <Divider style={styles.divider} />
            </>
          ) : null}
          <Text style={[styles.sectionTitle, { color: theme.text.default }]}>Metrics</Text>
          <MetricsFilter
            metrics={session.metrics}
            selected={selectedMetricNames}
            onChange={setSelectedMetricNames}
          />
          <MetricsPanel metrics={session.metrics} filter={selectedMetricNames} />
          <Divider style={styles.divider} />
          <Text style={[styles.sectionTitle, { color: theme.text.default }]}>Log events</Text>
          <LogsPanel logs={session.logs} />
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
          {showRawJson ? <JSONView value={stripCallStackTree(session)} /> : null}
        </>
      ) : (
        <Text style={[styles.notFound, { color: theme.text.default }]}>Session not found</Text>
      )}
    </ScrollView>
  );
}

/**
 * Normalizes a `Session` into a plain record, forcing `crashReport` to null
 * since a live (active) session can't have crashed yet. Lets the `main` route
 * render through the same presentational component as the inactive records.
 */
export async function liveSessionToRecord(session: Session): Promise<DebugSession> {
  const [metrics, logs, endDate] = await Promise.all([
    session.getMetrics(),
    session.getLogs(),
    session.getEndDate(),
  ]);
  return {
    id: session.id,
    type: session.type,
    startDate: session.startDate,
    endDate,
    metrics,
    logs,
    // A live session is always active, so it never has a crash report.
    crashReport: null,
  };
}

// The call stack tree balloons the raw JSON to the point where it can fail to render. It's
// already shown visually in the "Call stacks" section above, so we omit it from the raw JSON
// and replace it with a marker noting that.
function stripCallStackTree(session: DebugSession): DebugSession {
  if (!session.crashReport?.callStackTree) {
    return session;
  }
  return {
    ...session,
    crashReport: {
      ...session.crashReport,
      callStackTree: '<omitted, see Call stacks section>' as never,
    },
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
