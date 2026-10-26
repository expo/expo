import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RouteInSlot() {
  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
      }}>
      <Text style={{ color: '#fff' }}>Route in Slot</Text>
    </SafeAreaView>
  );
}
