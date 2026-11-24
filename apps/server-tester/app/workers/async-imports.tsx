import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Page } from '@/components/Page';
import { colors } from '@/components/theme';
import { multiply } from '@/workers/math';
import { loadOther } from '@/workers/shared-importer';
import type { Scenario } from '@/workers/worker-async';
import { createAsyncImportsWorker } from '@/workers/worker-client';

const scenarios: Scenario[] = [
  'worker-only',
  'shared-target',
  'shared-importer',
  'maybe-sync',
  'prefetch',
];

export default function WorkerAsyncImportsRoute() {
  const [results, setResults] = useState<Record<string, string>>({});

  useEffect(() => {
    const setResult = (name: string, result: string) =>
      setResults((prev) => ({ ...prev, [name]: result }));

    loadOther().then(({ otherResult }) => setResult('page-shared-importer', String(otherResult)));

    const worker = createAsyncImportsWorker();
    if (!worker) return;
    worker.onmessage = (event: MessageEvent<{ scenario: Scenario; result: string }>) => {
      setResult(`worker-${event.data.scenario}`, event.data.result);
    };
    for (const scenario of scenarios) {
      worker.postMessage(scenario);
    }

    const moduleWorker = createAsyncImportsWorker({ type: 'module' });
    if (!moduleWorker) return;
    moduleWorker.onmessage = (event: MessageEvent<{ scenario: Scenario; result: string }>) => {
      setResult(`module-worker-${event.data.scenario}`, event.data.result);
    };
    moduleWorker.postMessage('worker-only');

    return () => {
      worker.terminate();
      moduleWorker.terminate();
    };
  }, []);

  return (
    <Page title="Web worker async imports" testID="workers-async-imports">
      <Text testID="page-math" style={styles.text}>
        {multiply(2, 2)}
      </Text>
      {Object.keys(results).map((name) => (
        <Text key={name} testID={name} style={styles.text}>
          {results[name]}
        </Text>
      ))}
    </Page>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.text,
  },
});
