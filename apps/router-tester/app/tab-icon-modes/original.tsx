import { StyleSheet, Text, View } from 'react-native';

export default function OriginalTab() {
  return (
    <View style={styles.container}>
      <Text>
        Always original. iOS: multicolor sun.max.fill in both states. Android: the four-color dot in
        both states (tinting original).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
