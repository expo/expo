import { Text, View } from 'react-native';
import IThing from '../components/thing';
import Emitters from '../components/01-emitters';
import Actions from '../components/02-actions';
import { useBridge } from 'expo/webview';
import { ComponentProps } from 'react';

// Utility type to combine WebView props with the actions prop from a given component
type BridgeView<T extends React.ComponentType<any>> = React.ComponentType<
  Omit<ComponentProps<typeof import('react-native-webview').WebView>, 'actions'> & {
    actions: ComponentProps<T>['actions'];
  }
>;

// const Thing = IThing as unknown as BridgeView<typeof IThing>;

// const TestWebView = require('../components/test-webview').default as unknown as BridgeView<
//   typeof IThing
// >;

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
        actions={{
          showAlert(time) {
            alert('Hello, world! ' + time);
          },
          throwError() {
            throw new Error('hey');
          },
          async getNativeSettings() {
            // RN is pretty bad at accessing basic native info.
            return 'native setting';
          },
        }}
      />
    </View>
  );
}

{
  /* <Thing
        {...bridge}
        actions={{
          showAlert(time) {
            alert('Hello, world! ' + time);
          },
        }}
      /> */
}

{
  /* 
<TestWebView
  {...bridge}
  actions={{
    showAlert() {
      alert('Hello, world!');
    },
  }}
/> */
}
