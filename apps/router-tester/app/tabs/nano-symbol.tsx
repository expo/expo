import { StyleSheet, Text, View } from 'react-native';

export default function NanoSymbol() {
  return (
    <View style={styles.container}>
      <Text>This tab uses a multicolor react-native-nano-icons custom symbol.</Text>
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
