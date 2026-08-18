import AppMetrics from 'expo-app-metrics';
import { useObserve } from 'expo-observe';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Button } from '@/components/Button';
import { CrashReportsSection } from '@/components/CrashReportsSection';
import { Divider } from '@/components/Divider';
import { GlobalAttributesSection } from '@/components/GlobalAttributesSection';
import { JSAnimation } from '@/components/JSAnimation';
import { JSErrorsSection } from '@/components/JSErrorsSection';
import { LogEventsSection } from '@/components/LogEventsSection';
import { NetworkRequestObserverSection } from '@/components/NetworkRequestObserverSection';
import { RenderErrorSection } from '@/components/RenderErrorSection';
import { ReportErrorSection } from '@/components/ReportErrorSection';
import CrashTester from '@/modules/crash-tester';
import { useTheme } from '@/utils/theme';

export default function Debug() {
  const theme = useTheme();
  const [showAnimation, setShowAnimation] = useState(false);

  const { markInteractive } = useObserve();

  useEffect(() => {
    setTimeout(() => {
      markInteractive();
    }, 1000);
  }, []);

  return (
    <ScrollView
      style={{ backgroundColor: theme.background.screen }}
      contentContainerStyle={styles.container}>
      <LogEventsSection />
      <Divider />
      <NetworkRequestObserverSection />
      <Divider />
      <CrashReportsSection />
      {CrashTester != null ? <Divider /> : null}
      <JSErrorsSection />
      <Divider />
      <ReportErrorSection />
      <Divider />
      <RenderErrorSection />
      <Divider />
      <GlobalAttributesSection />
      <Divider />
      <Button
        title={showAnimation ? 'Hide JS Animation' : 'Show JS Animation'}
        onPress={() => setShowAnimation(!showAnimation)}
        theme="secondary"
      />
      {showAnimation && <JSAnimation />}
      <Button
        title="Log main session to console"
        onPress={async () => {
          const session = AppMetrics.getMainSession();
          const [metrics, logs, isActive, endDate] = await Promise.all([
            session.getMetrics(),
            session.getLogs(),
            session.isActive(),
            session.getEndDate(),
          ]);
          console.log(
            JSON.stringify(
              {
                id: session.id,
                type: session.type,
                startDate: session.startDate,
                endDate,
                isActive,
              },
              null,
              2
            )
          );
          console.log(JSON.stringify(metrics, null, 2));
          console.log(JSON.stringify(logs, null, 2));
        }}
        theme="secondary"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
});
