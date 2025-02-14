import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import Worker from '../worker-one.ts?worker';

const worker = new Worker();

let result;

worker.onmessage = function (event) {
  if (!result) {
    result = document.createElement('div');
    result.setAttribute('id', 'result');

    document.body.append(result);
  }

  result.innerText = JSON.stringify(event.data);
};

export default function Page() {
  const [data, setData] = useState();

  useEffect(() => {
    worker.onmessage = function (event) {
      setData((data) => [...data, JSON.stringify(event.data)]);
    };
  }, []);

  return (
    <>
      <Text
        onPress={() => {
          worker.postMessage({ postMessage: true });
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
