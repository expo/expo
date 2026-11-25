import { PlatformColor, StyleSheet, Text, View } from 'react-native';

export default function NoContact() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>No Contact Selected</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: PlatformColor('systemGroupedBackground'),
  },
  text: { fontSize: 24, fontWeight: '700', color: PlatformColor('label'), textAlign: 'center' },
});
