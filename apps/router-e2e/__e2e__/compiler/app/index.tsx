import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { useBananas, useFruit } from './hooks/useFruit';

let count = 0;

const getCount = () => ++count;

export default function Page() {
  const [isMounted, setIsMounted] = useState(false);

  // If React Compiler works, we expect the update above to not
  // update the count result from this invocation
  const count = getCount();

  useBananas();

  const fruits = useFruit();
  if (fruits !== 'Fresh Fruits are delicious!') {
    throw new Error(`Expected 'Fresh Fruits are delicious!', got '${fruits}'`);
  }

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <Text testID="test-anchor">Test</Text>
      {isMounted && count === 1 && <Child />}
    </>
  );
}

function Child() {
  return <Text testID="react-compiler">2</Text>;
}
