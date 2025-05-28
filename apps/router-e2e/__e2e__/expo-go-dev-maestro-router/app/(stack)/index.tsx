import { Link, router } from 'expo-router';
import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View
      style={{
        backgroundColor: '#333',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text testID="e2e-screen" style={{ color: 'red' }}>
        Stack index
      </Text>
      <Text testID="e2e-can-go-back" style={{ color: 'red' }}>
        {router.canGoBack()}
      </Text>
      <Link testID="e2e-push-apple" href="./(stack)/apple" push style={{ color: 'red' }}>
        Push apple
      </Link>
    </View>
  );
}
