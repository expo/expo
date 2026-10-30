import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Protected() {
  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
      }}>
      <Text>Protected Route</Text>
    </SafeAreaView>
  );
}
