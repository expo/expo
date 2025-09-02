import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { useBananas, useFruit } from './hooks/useFruit';

export default function Page() {
  const [isMounted, setIsMounted] = useState(false);

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
      {isMounted && <CompilerSlots />}
    </>
  );
}

function CompilerSlots() {
  const compilerSlots = eval('$');
  if ('length' in compilerSlots) {
    return <Text testID="react-compiler">{compilerSlots.length}</Text>;
  }
  return null;
}
