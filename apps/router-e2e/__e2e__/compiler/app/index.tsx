import { Text } from 'react-native';

export default function Page() {
  let compilerJsx: any;
  if (typeof window !== 'undefined') {
    const compilerSlots = eval('$');
    if ('length' in compilerSlots)
      compilerJsx = <Text testID="react-compiler">{compilerSlots.length}</Text>;
  }

  return (
    <>
      <Text testID="test-anchor">Test</Text>
      {compilerJsx}
    </>
  );
}
