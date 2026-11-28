import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Page } from '@/components/Page';
import { colors } from '@/components/theme';

export default function WorkersRoute() {
  const [data, setData] = useState<number[]>([]);
  const workerRef = useRef<Worker | null>(null);

  // Do not change this value, it is used in tests
  const input = 'ROUTE_VALUE';

  useEffect(() => {
    let worker: Worker | null = null;
    Promise.all([import('@/workers/worker-client'), import('@/workers/other')]).then(
      ([{ createWorker }, { otherResult }]) => {
        console.log('other result', otherResult);
        worker = createWorker();
        if (!worker) return;
        workerRef.current = worker;
        worker.onmessage = (event: MessageEvent<number>) => {
          setData((prev) => [...prev, event.data]);
        };
        worker.postMessage(5); // Send a number to the worker
      }
    );

    return () => worker?.terminate();
  }, []);

  return (
    <Page title="Web workers" testID="workers-index">
      <Text
        onPress={() => {
          workerRef.current?.postMessage(10);
        }}
        testID="test-anchor"
        style={styles.text}>
        Test
      </Text>
      <Text testID="test-hmr" style={styles.text}>
        {input}
      </Text>
      {data.map((item, index) => (
        <Text key={index} testID={`data-${index}`} style={styles.text}>
          {item}
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
