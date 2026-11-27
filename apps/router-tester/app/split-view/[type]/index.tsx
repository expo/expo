import { PlatformColor, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: PlatformColor('label'), fontSize: 24, fontWeight: 'bold' }}>
        Nothing is selected
      </Text>
    </SafeAreaView>
  );
}
