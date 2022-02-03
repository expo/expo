import { H2 } from '@expo/html-elements';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, View, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';

interface MessageEvent {
  nativeEvent: {
    data: string;
  };
}

const injectedJavaScript = `window.ReactNativeWebView.postMessage(JSON.stringify(window.location));`;

export default function WebViewScreen() {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flex: 1 }}>
      <WebViewRemoteSource />
      <WebViewInlineSource />
    </ScrollView>
  );
}

WebViewScreen.navigationOptions = {
  title: 'WebView',
};

function WebViewRemoteSource() {
  const [isLoading, setLoading] = React.useState(true);

  return (
    <View style={styles.container}>
      <H2 style={styles.header}>Remote Source</H2>
      <WebView
        source={{ uri: 'https://expo.dev/' }}
        onLoadEnd={() => setLoading(false)}
        onMessage={({ nativeEvent: { data } }: MessageEvent) => {
          console.log('Got a message from WebView: ', JSON.parse(data));
        }}
        injectedJavaScript={injectedJavaScript}
      />
      {isLoading && <ActivityIndicator style={StyleSheet.absoluteFill} />}
    </View>
  );
}

function WebViewInlineSource() {
  return (
    <View style={styles.container}>
      <H2 style={styles.header}>Inline Source</H2>
      <WebView
        style={{ width: '100%', height: 250 }}
        source={{
          html: `
    <h2>You can always use a WebView if you need to!</h2>
    <p>
      <h4>But don't the other components above seem like better building blocks for most of your UI?</h4>
      <input type="text" placeholder="Disagree? why?" />
      <input type="submit">
    </p>
    <p>
      <a href="https://expo.dev">expo.dev</a>
    </p>
  `,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '50%',
    overflow: 'hidden',
  },
  header: {
    marginLeft: 8,
  },
});
