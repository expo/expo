import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default class WebViewScreen extends React.Component {
  static navigationOptions = {
    title: 'WebView',
  };

  state = {
    loading: true,
  };

  handleLoadEnd = () => this.setState({ loading: false });

  render() {
    return (
      <View style={styles.container}>
        <WebView source={{ uri: 'https://expo.io/' }} onLoadEnd={this.handleLoadEnd} />
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
