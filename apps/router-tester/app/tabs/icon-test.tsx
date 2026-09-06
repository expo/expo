import { StyleSheet, Text, View } from 'react-native';

export default function IconTest() {
  return (
    <View style={styles.container}>
      <Text>This tab uses an image icon with its original colors.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
