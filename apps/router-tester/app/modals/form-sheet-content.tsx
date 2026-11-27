import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen() {
  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{ justifyContent: 'center', alignItems: 'center', height: 100 }}>
      <Text>Form Sheet Modal Content</Text>
    </SafeAreaView>
  );
}
