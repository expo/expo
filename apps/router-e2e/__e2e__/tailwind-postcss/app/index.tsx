import { Text, View } from 'react-native';
import IThing from '../components/thing';
import { useBridge } from 'expo/webview';

const Thing = IThing as unknown as typeof import('react-native-webview').WebView;

export default function Page() {
  const [emit, bridge] = useBridge((data) => {
    console.log('NATIVE:', data);
  });
  return (
    <View style={{ flex: 1, padding: 56 }}>
      <Text
        onPress={() => {
          console.log('send');
          emit({ type: 'hello', data: 'world' });
        }}>
        Send to Webview
      </Text>
      <Thing {...bridge} />
    </View>
  );
}
