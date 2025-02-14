import { useEffect, useState } from 'react';
import { Text } from 'react-native';

const entry = require.resolveWorker('../worker-one');
const url = new URL(entry, window.location.href);
console.log('url:', url, entry);
const worker = new Worker(url);
console.log('res:', worker);

worker.onmessage = (event) => {
  console.log(`Worker responded: ${event.data}`);
};

worker.postMessage(5); // Send a number to the worker

export default function Page() {
  const [data, setData] = useState([]);

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
        <Text key={index}>{item}</Text>
      ))}
    </>
  );
}
