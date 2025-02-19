import { useEffect, useState } from 'react';
import { Text } from 'react-native';

const worker = require.unstable_importWorker('../worker-one');

//
export default function Page() {
  const [data, setData] = useState([]);

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
      {data.map((item, index) => (
        <Text key={index} testID={`data-${index}`}>
          {item}
        </Text>
      ))}
    </>
  );
}
