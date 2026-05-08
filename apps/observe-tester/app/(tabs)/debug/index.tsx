import AppMetrics from 'expo-app-metrics';
import { useObserve } from 'expo-observe';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Button } from '@/components/Button';
import { CrashReportsSection } from '@/components/CrashReportsSection';
import { Divider } from '@/components/Divider';
import { JSAnimation } from '@/components/JSAnimation';
import { LogEventsSection } from '@/components/LogEventsSection';
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
      {typeof AppMetrics.logEvent === 'function' ? <Divider /> : null}
      <CrashReportsSection />
      {typeof AppMetrics.triggerCrash === 'function' ? <Divider /> : null}
      <Button
        title={showAnimation ? 'Hide JS Animation' : 'Show JS Animation'}
        onPress={() => setShowAnimation(!showAnimation)}
        theme="secondary"
      />
      {showAnimation && <JSAnimation />}
      <Button
        title="Log main session to console"
        onPress={() => AppMetrics.getMainSession().then(JSON.stringify).then(console.log)}
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
