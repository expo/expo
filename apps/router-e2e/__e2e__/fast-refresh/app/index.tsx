import React from 'react';
import { Button, Text, View } from 'react-native';

// @ts-expect-error - CSS module is not typed in our test environment
import styles, { unstable_styles } from './FastRefresh.module.css';

export default function Page() {
  const [index, setIndex] = React.useState(0);
  // Do not change this value, it is used in tests
  const input = 'ROUTE_VALUE';

  return (
    <>
      <Button testID="index-increment" onPress={() => setIndex((i) => i + 1)} title="increment" />
      <Text testID="index-count">{index}</Text>
      <Text testID="index-text">{input}</Text>
      <View style={unstable_styles.container} testID="css-module-container">
        <p className={styles.test} data-testid="css-module">
          CSS Module
        </p>
      </View>
    </>
  );
}
