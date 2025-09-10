import { Link } from 'expo-router';
import { View } from 'react-native';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'gray',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Link href="/second" style={{ fontSize: 24, color: 'white' }}>
        Go to second screen
      </Link>
    </View>
  );
}
