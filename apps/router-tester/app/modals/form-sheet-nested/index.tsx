import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen() {
  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Form Sheet Modal - nested Stack</Text>
    </SafeAreaView>
  );
}
