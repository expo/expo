import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IconTest() {
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.container}>
      <Text>This tab uses an image icon with its original colors.</Text>
    </SafeAreaView>
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
