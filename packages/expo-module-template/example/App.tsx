import { StyleSheet, Text, View } from 'react-native';

import * as <%- project.name %> from '<%- project.slug %>';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>{<%- project.name %>.hello()}</Text>
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
