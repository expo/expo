import AppMetrics, { type Session } from 'expo-app-metrics';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { CallStackTreeView } from '@/components/CallStackTreeView';
import { Chevron } from '@/components/Chevron';
import { CrashReportPanel } from '@/components/CrashReportPanel';
import { Divider } from '@/components/Divider';
import { JSONView } from '@/components/JSONView';
import { LogsPanel } from '@/components/LogsPanel';
import { MetricsPanel } from '@/components/MetricsPanel';
import { SessionHeader } from '@/components/SessionHeader';
import { useTheme } from '@/utils/theme';

export default function SessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  useFocusEffect(
    useCallback(() => {
      AppMetrics.getAllSessions().then((sessions) => {
        setSession(sessions.find((s) => s.id === id) ?? null);
        setLoaded(true);
      });
    }, [id])
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.contentContainer}>
      <Stack.Screen options={{ title: id?.slice(0, 8) ?? 'Session' }} />
      {!loaded ? null : session ? (
        <>
          <SessionHeader session={session} />
          <Divider style={styles.divider} />
          {session.type === 'main' && session.crashReport ? (
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
          <MetricsPanel metrics={session.metrics} />
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

// The call stack tree balloons the raw JSON to the point where it can fail to render. It's
// already shown visually in the "Call stacks" section above, so we omit it from the raw JSON
// and replace it with a marker noting that.
function stripCallStackTree(session: Session): Session {
  if (session.type !== 'main' || !session.crashReport?.callStackTree) {
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
