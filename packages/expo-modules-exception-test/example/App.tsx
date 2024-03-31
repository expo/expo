import { StyleSheet, Text, View } from 'react-native';

import * as ExpoModulesExceptionTest from 'expo-modules-exception-test';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>{ExpoModulesExceptionTest.hello()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
