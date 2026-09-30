import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { withSequence, withSpring } from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';

import { Button } from '@/components/Button';
import { useTheme } from '@/utils/theme';

// `logger` is internal to Reanimated. It is the only way to emit a Reanimated error on demand,
// because the real `logger.error` call sites are hard to reach. The path matches the source
// entry that Metro resolves through Reanimated's `react-native` field, so this is the same module
// instance that Reanimated uses. It is required, not imported, so that TypeScript doesn't
// type-check Reanimated's source with this app's settings.
const { logger } = require('react-native-reanimated/src/common/logger') as {
  logger: { error(message: string): void };
};

type Sample = {
  label: string;
  kind: 'warning' | 'error';
  runtime: 'RN' | 'UI';
  run: () => void;
};

// The integration reports each distinct message once per launch, so the samples that run on
// both runtimes use different values in their messages.
const SAMPLES: Sample[] = [
  {
    label: 'Invalid spring config',
    kind: 'warning',
    runtime: 'RN',
    run: () => {
      withSpring(1, { stiffness: -1 });
    },
  },
  {
    label: 'Invalid spring config',
    kind: 'warning',
    runtime: 'UI',
    run: () => {
      scheduleOnUI(() => {
        'worklet';
        withSpring(1, { stiffness: -2 });
      });
    },
  },
  {
    label: 'Empty withSequence()',
    kind: 'warning',
    runtime: 'UI',
    run: () => {
      scheduleOnUI(() => {
        'worklet';
        withSequence();
      });
    },
  },
  {
    label: 'Synthetic logger.error',
    kind: 'error',
    runtime: 'RN',
    run: () => {
      logger.error('Sample error from the React Native runtime (observe-tester)');
    },
  },
  {
    label: 'Synthetic logger.error',
    kind: 'error',
    runtime: 'UI',
    run: () => {
      scheduleOnUI(() => {
        'worklet';
        logger.error('Sample error from the UI runtime (observe-tester)');
      });
    },
  },
];

function sampleKey(sample: Sample) {
  return `${sample.label} (${sample.runtime})`;
}

export default function ReanimatedExample() {
  const theme = useTheme();
  const [tapCounts, setTapCounts] = useState<Record<string, number>>({});

  function runSample(sample: Sample) {
    sample.run();
    const key = sampleKey(sample);
    setTapCounts((previous) => ({ ...previous, [key]: (previous[key] ?? 0) + 1 }));
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.description, { color: theme.text.secondary }]}>
        Each button triggers a Reanimated log. Warnings become `reanimated.warning` events and
        errors become `reanimated.error` errors in EAS Observe. Each distinct message is reported
        once per app launch, so a second tap only prints to the console.
      </Text>
      <Button title="Run all" onPress={() => SAMPLES.forEach(runSample)} />
      {SAMPLES.map((sample) => {
        const key = sampleKey(sample);
        return (
          <Button
            key={key}
            title={`${sample.kind === 'error' ? 'Error' : 'Warning'}: ${key}`}
            description={`Tapped ${tapCounts[key] ?? 0}×`}
            theme="secondary"
            onPress={() => runSample(sample)}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: Platform.select({ ios: 30, android: 150 }),
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
  },
});
