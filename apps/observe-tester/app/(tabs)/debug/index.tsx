import AppMetrics from 'expo-app-metrics';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Button } from '@/components/Button';
import { CrashReportsSection } from '@/components/CrashReportsSection';
import { Divider } from '@/components/Divider';
import { JSAnimation } from '@/components/JSAnimation';
import { useRouterMetricsHelpers } from '@/router-metrics-integration';
import { useTheme } from '@/utils/theme';

export default function Debug() {
  const theme = useTheme();
  const [showAnimation, setShowAnimation] = useState(false);

  const { markPageInteractive } = useRouterMetricsHelpers();

  useEffect(() => {
    setTimeout(() => {
      markPageInteractive();
    }, 1000);
  }, [markPageInteractive]);

  return (
    <ScrollView
      style={{ backgroundColor: theme.background.screen }}
      contentContainerStyle={styles.container}>
      <CrashReportsSection />
      {typeof AppMetrics.triggerCrash === 'function' ? <Divider /> : null}
      <Button
        title={showAnimation ? 'Hide JS Animation' : 'Show JS Animation'}
        onPress={() => setShowAnimation(!showAnimation)}
        theme="secondary"
      />
      {showAnimation && <JSAnimation />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
});
