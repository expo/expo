import React from 'react';
import { Alert, View, StyleSheet, Text, Switch, TextInput } from 'react-native';
import { WebBrowser } from 'expo';
import Button from '../components/Button';

export default class App extends React.Component {
  static navigationOptions = {
    title: 'WebBrowser',
  };

  state = {
    showTitle: false,
    colorText: undefined,
  };

  render() {
    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}>
        <View
          style={{
            paddingBottom: 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text>Toolbar color (#rrggbb):</Text>
          <TextInput
            style={{
              padding: 10,
              width: 100,
            }}
            borderBottomColor={'black'}
            placeholder={'RRGGBB'}
            onChangeText={value => this.setState({ colorText: value })}
            value={this.state.colorText}
          />
        </View>
        <View
          style={{
            paddingBottom: 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text>Show Title</Text>
          <Switch
            style={{ padding: 5 }}
            onValueChange={value => this.setState({ showTitle: value })}
            value={this.state.showTitle}
          />
        </View>
        <Button
          style={styles.button}
          onPress={async () => {
            const result = await WebBrowser.openBrowserAsync('https://www.google.com', {
              showTitle: this.state.showTitle,
              toolbarColor: this.state.colorText ? '#' + this.state.colorText : undefined,
            });
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
