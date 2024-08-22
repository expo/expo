import { TabTrigger } from 'expo-router/ui';
import { StyleSheet, Text, View } from 'react-native';

export default function OtherPage() {
  return (
    <View>
      <Text style={styles.header}>Text Page</Text>
      <TabTrigger name="movies" style={styles.listItem}>
        <Text>Jump to movies tab</Text>
      </TabTrigger>
      <TabTrigger name="movies" reset>
        <Text>Jump to movies tab (and reset tab)</Text>
      </TabTrigger>
      <TabTrigger name="movies" reset="long">
        <Text>Jump to movies tab (and reset on long press)</Text>
      </TabTrigger>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    marginBottom: 20,
  },
  listItem: {
    marginVertical: 20,
  },
});
