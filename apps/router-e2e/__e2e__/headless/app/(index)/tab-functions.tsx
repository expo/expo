import { TabTrigger } from 'expo-router/ui';
import { StyleSheet, Text, View } from 'react-native';

export default function OtherPage() {
  return (
    <View>
      <Text style={styles.header}>Test Page</Text>
      <TabTrigger name="movies" style={styles.listItem}>
        <Text>Jump to movies tab</Text>
      </TabTrigger>
      <TabTrigger name="movies" reset="always" style={styles.listItem}>
        <Text>Jump to movies tab (and reset tab)</Text>
      </TabTrigger>
      <TabTrigger name="movies" reset="onLongPress" style={styles.listItem}>
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
    marginVertical: 10,
  },
});
