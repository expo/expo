import { useEffect, useState } from 'react';
import { Text } from 'react-native';

const worker = new Worker(new URL('../worker-one', window.location.href));

export default function Page() {
  const [data, setData] = useState([]);

  // Do not change this value, it is used in tests
  const input = 'ROUTE_VALUE';

  useEffect(() => {
    worker.onmessage = (event) => {
      setData((prev) => [...prev, event.data]);
    };

    worker.postMessage(5); // Send a number to the worker
  }, []);

  return (
    <>
      <Text
        onPress={() => {
          worker.postMessage(10);
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
