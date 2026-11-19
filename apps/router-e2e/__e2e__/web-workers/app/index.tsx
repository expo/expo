import { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';

export default function Page() {
  const [data, setData] = useState<number[]>([]);
  const workerRef = useRef<Worker | null>(null);

  // Do not change this value, it is used in tests
  const input = 'ROUTE_VALUE';

  useEffect(() => {
    let worker: Worker | undefined;
    Promise.all([import('../worker-client'), import('../other')]).then(
      ([{ createWorker }, { otherResult }]) => {
        console.log('other result', otherResult);
        worker = createWorker();
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
    <>
      <Text
        onPress={() => {
          workerRef.current?.postMessage(10);
        }}
        testID="test-anchor">
        Test
      </Text>
      <Text testID="test-hmr">{input}</Text>
      {data.map((item, index) => (
        <Text key={index} testID={`data-${index}`}>
          {item}
        </Text>
      ))}
    </>
  );
}
