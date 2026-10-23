import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen() {
  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Page Sheet Modal Content</Text>
    </SafeAreaView>
  );
}
