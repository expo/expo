import React from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { WebBrowser } from 'expo';
import Button from '../components/Button';

export default class WebBrowserScreen extends React.Component {
  static navigationOptions = {
    title: 'WebBrowser',
  };

  render() {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <Button
          style={styles.button}
          onPress={async () => {
            const result = await WebBrowser.openBrowserAsync('https://www.google.com');
            setTimeout(() => Alert.alert('Result', JSON.stringify(result, null, 2)), 1000);
          }}
          title="Open web url"
        />
        <Button
          style={styles.button}
          onPress={async () => {
            const result = await WebBrowser.getCustomTabsSupportingBrowsers();
            Alert.alert('Result', JSON.stringify(result, null, 2));
          }}
          title="Show supporting browsers."
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    margin: 10,
  },
});
