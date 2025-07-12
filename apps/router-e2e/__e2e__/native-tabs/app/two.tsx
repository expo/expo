import { BottomAccessory, Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function Two() {
  console.log('two');

  return (
    <View
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#afa' }}>
      <BottomAccessory
        style={{
          flex: 1,
          borderRadius: 24,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          backgroundColor: '#fff8',
        }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>First</Text>
      </BottomAccessory>
      <BottomAccessory
        style={{
          flex: 1,
          borderRadius: 24,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          backgroundColor: '#fff8',
        }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Second</Text>
      </BottomAccessory>
      <Text testID="e2e-screen">Two</Text>
      <Link href="/three/apple">Go to apple</Link>
    </View>
  );
}
