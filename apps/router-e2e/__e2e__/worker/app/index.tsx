import { useEffect, useState } from 'react';
import { Text } from 'react-native';

// import Worker from '../worker-one.ts?worker';

// import('../foo');

const worker = new Worker(new URL(require.resolve('../worker-one'), window.location.href));
console.log('res:', worker);
// // const worker = new Worker(new URL('../worker.js', import.meta.url))

// // Match `new URL('../worker.js', import.meta.url)` as dependency on file.
// // Convert to `require.resolve('../worker.js')`
// // resolve func should make the URL in development.
// // resolve func should pull

// // const worker = new Worker();

// let result;

// // const worker = new Worker();

// worker.onmessage = (event) => {
//   console.log(`Worker responded: ${event.data}`);
// };

// worker.postMessage(5); // Send a number to the worker

// worker.onmessage = function (event) {
//   if (!result) {
//     result = document.createElement('div');
//     result.setAttribute('id', 'result');

//     document.body.append(result);
//   }

//   result.innerText = JSON.stringify(event.data);
// };

export default function Page() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // worker.onmessage = function (event) {
    //   setData((data) => [...data, JSON.stringify(event.data)]);
    // };
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
        <Text key={index}>{item}</Text>
      ))}
    </>
  );
}
