import { use } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ToolbarPressContext } from '@/components/split-view-mail';

export default function NoMessage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>No Message Selected</Text>
      <Text>Last toolbar press: {use(ToolbarPressContext)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '600' },
});
