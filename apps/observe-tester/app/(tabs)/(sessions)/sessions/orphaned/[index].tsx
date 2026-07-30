import AppMetrics, { type CrashReport } from 'expo-app-metrics';
import { useObserve } from 'expo-observe';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { CallStackTreeView } from '@/components/CallStackTreeView';
import { CrashReportPanel } from '@/components/CrashReportPanel';
import { Divider } from '@/components/Divider';
import { useTheme } from '@/utils/theme';

// Detail for a startup crash that isn't attributed to any session. The list passes
// the report's position among the orphans (`sessionId` null) in `getAllCrashReports`;
// we re-fetch and filter that same ordered list and look it up by index, since crash
// reports have no stable id. The index is only stable within a launch, but orphaned
// crashes are only produced at startup — never while the app is foregrounded — so the
// list can't shift under an open detail screen.
export default function OrphanedCrashScreen() {
  const theme = useTheme();
  const { index } = useLocalSearchParams<{ index: string }>();
  const [report, setReport] = useState<CrashReport | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      AppMetrics.getAllCrashReports?.().then((reports) => {
        if (cancelled) return;
        const orphans = reports.filter((report) => report.sessionId == null);
        setReport(orphans[Number(index)] ?? null);
        setLoaded(true);
      });
      return () => {
        cancelled = true;
      };
    }, [index])
  );

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
      <Stack.Screen options={{ title: 'Startup crash' }} />
      {!loaded ? null : report ? (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text.default }]}>Crash report</Text>
          <CrashReportPanel report={report} />
          {report.callStackTree ? (
            <>
              <Divider style={styles.divider} />
              <Text style={[styles.sectionTitle, { color: theme.text.default }]}>Call stacks</Text>
              <CallStackTreeView tree={report.callStackTree} />
            </>
          ) : null}
        </>
      ) : (
        <Text style={[styles.notFound, { color: theme.text.default }]}>Crash report not found</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  contentContainer: {
    paddingBottom: Platform.select({ ios: 30, android: 150 }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 16,
  },
  notFound: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
