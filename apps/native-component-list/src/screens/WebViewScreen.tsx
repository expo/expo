import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface MessageEvent {
  nativeEvent: {
    data: string;
  };
}

const injectedJavaScript = `window.ReactNativeWebView.postMessage(JSON.stringify(window.location));`;

export default class WebViewScreen extends React.Component {
  static navigationOptions = {
    title: 'WebView',
  };

  state = {
    loading: true,
  };

  handleLoadEnd = () => this.setState({ loading: false });

  handleMessage = ({ nativeEvent: { data } }: MessageEvent) => {
    console.log('Got a message from WebView: ', JSON.parse(data));
  };

  render() {
    return (
      <View style={styles.container}>
        <WebView
          source={{ uri: 'https://expo.io/' }}
          onLoadEnd={this.handleLoadEnd}
          onMessage={this.handleMessage}
          injectedJavaScript={injectedJavaScript}
        />
        {this.state.loading && <ActivityIndicator style={StyleSheet.absoluteFill} />}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
