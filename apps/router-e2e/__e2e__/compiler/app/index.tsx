import { useEffect, useState } from 'react';
import { Text } from 'react-native';

export default function Page() {
  const [isMounted, setIsMounted] = useState(false);

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
