import React from 'react';
import { Alert, View, StyleSheet, Text, Switch, TextInput, Picker, Platform } from 'react-native';
import { WebBrowser } from 'expo';
import Button from '../components/Button';

export default class WebBrowserScreen extends React.Component {
  constructor() {
    super();
    this.androidChoices = this.androidChoices.bind(this);
    this.androidButtons = this.androidButtons.bind(this);
  }

  static navigationOptions = {
    title: 'WebBrowser',
  };

  state = {
    showTitle: false,
    colorText: undefined,
    packages: undefined,
    selectedPackage: undefined,
    barCollapsing: false,
  };

  async componentDidMount() {
    Platform.OS === 'android' &&
      WebBrowser.getCustomTabsSupportingBrowsersAsync().then(result => {
        this.setState({ packages: result.packages.map(name => ({ label: name, value: name })) });
      });
  }

  androidChoices() {
    return (
      Platform.OS === 'android' && (
        <>
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
          <View
            style={{
              paddingBottom: 5,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text>Force package:</Text>
            <Picker
              style={{
                padding: 10,
                width: 150,
              }}
              selectedValue={this.state.selectedPackage}
              onValueChange={value => {
                console.log(value);
                this.setState({ selectedPackage: value });
              }}>
              {this.state.packages &&
                [{ label: '(none)', value: '' }, ...this.state.packages].map(({ value, label }) => {
                  return <Picker.Item key={value} label={label} value={value} />;
                })}
            </Picker>
          </View>
        </>
      )
    );
  }

  androidButtons() {
    return (
      Platform.OS === 'android' && (
        <Button
          style={styles.button}
          onPress={async () => {
            const result = await WebBrowser.getCustomTabsSupportingBrowsersAsync();
            Alert.alert('Result', JSON.stringify(result, null, 2));
          }}
          title="Show supporting browsers."
        />
      )
    );
  }

  render() {
    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}>
        {this.androidChoices()}
        <View
          style={{
            paddingBottom: 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text>Bar collapsing</Text>
          <Switch
            style={{ padding: 5 }}
            onValueChange={value => this.setState({ barCollapsing: value })}
            value={this.state.barCollapsing}
          />
        </View>
        <Button
          style={styles.button}
          onPress={async () => {
            const args = {
              showTitle: this.state.showTitle,
              toolbarColor: this.state.colorText ? '#' + this.state.colorText : undefined,
              package: this.state.selectedPackage,
              enableBarCollapsing: this.state.barCollapsing,
            };
            const result = await WebBrowser.openBrowserAsync('https://www.onet.pl', args);
            setTimeout(() => Alert.alert('Result', JSON.stringify(result, null, 2)), 1000);
          }}
          title="Open web url"
        />
        {this.androidButtons()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    margin: 10,
  },
});
