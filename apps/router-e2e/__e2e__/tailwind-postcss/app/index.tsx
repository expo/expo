import { Text, View } from 'react-native';
import Actions from '../components/02-actions';
import { useBridge } from 'expo/dom';

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

      {/* <Emitters {...bridge} /> */}

      <Actions
        showAlert={(time) => {
          alert('Hello, world! ' + time);
        }}
        throwError={() => {
          throw new Error('hey');
        }}
        getNativeSettings={async () => {
          // RN is pretty bad at accessing basic native info.
          return 'native setting';
        }}
      />
    </View>
  );
}
