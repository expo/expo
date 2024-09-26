import React from 'react';
import { Button, Text } from 'react-native';

export default function Page() {
  const [index, setIndex] = React.useState(0);
  // Do not change this value, it is used in tests
  const input = 'ROUTE_VALUE';

  return (
    <>
      <Button testID="index-increment" onPress={() => setIndex((i) => i + 1)} title="increment" />
      <Text testID="index-count">{index}</Text>
      <Text testID="index-text">{input}</Text>
    </>
  );
}
