import React from 'react';
import { Alert, View, StyleSheet, Text, Switch, TextInput, Picker, Platform } from 'react-native';
import { WebBrowser } from 'expo';
import Button from '../components/Button';

export default class WebBrowserScreen extends React.Component {
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

  barCollapsingSwitchChanged = value => {
    this.setState({ barCollapsing: value });
  };

  showPackagesAlert = async () => {
    const result = await WebBrowser.getCustomTabsSupportingBrowsersAsync();
    Alert.alert('Result', JSON.stringify(result, null, 2));
  };

  openWebUrlRequested = async () => {
    const args = {
      showTitle: this.state.showTitle,
      toolbarColor: this.state.colorText ? '#' + this.state.colorText : undefined,
      package: this.state.selectedPackage,
      enableBarCollapsing: this.state.barCollapsing,
    };
    const result = await WebBrowser.openBrowserAsync('https://www.onet.pl', args);
    setTimeout(() => Alert.alert('Result', JSON.stringify(result, null, 2)), 1000);
  };

  toolbarColorInputChanged = value => this.setState({ colorText: value });

  packageSelected = value => {
    this.setState({ selectedPackage: value });
  };

  showTitleChanged = value => this.setState({ showTitle: value });

  renderAndroidChoices = () =>
    Platform.OS === 'android' && (
      <>
        <View style={styles.label}>
          <Text>Toolbar color (#rrggbb):</Text>
          <TextInput
            style={styles.input}
            borderBottomColor={'black'}
            placeholder={'RRGGBB'}
            onChangeText={this.toolbarColorInputChanged}
            value={this.state.colorText}
          />
        </View>
        <View style={styles.label}>
          <Text>Show Title</Text>
          <Switch
            style={styles.switch}
            onValueChange={this.showTitleChanged}
            value={this.state.showTitle}
          />
        </View>
        <View style={styles.label}>
          <Text>Force package:</Text>
          <Picker
            style={styles.picker}
            selectedValue={this.state.selectedPackage}
            onValueChange={this.packageSelected}>
            {this.state.packages &&
              [{ label: '(none)', value: '' }, ...this.state.packages].map(({ value, label }) => (
                <Picker.Item key={value} label={label} value={value} />
              ))}
          </Picker>
        </View>
      </>
    );

  renderAndroidButtons = () =>
    Platform.OS === 'android' && (
      <Button
        style={styles.button}
        onPress={this.showPackagesAlert}
        title="Show supporting browsers."
      />
    );

  render() {
    return (
      <View style={styles.container}>
        {this.renderAndroidChoices()}
        <View style={styles.label}>
          <Text>Bar collapsing</Text>
          <Switch
            style={styles.switch}
            onValueChange={this.barCollapsingSwitchChanged}
            value={this.state.barCollapsing}
          />
        </View>
        <Button style={styles.button} onPress={this.openWebUrlRequested} title="Open web url" />
        {this.renderAndroidButtons()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  label: {
    paddingBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    padding: 10,
    width: 100,
  },
  switch: { padding: 5 },
  picker: {
    padding: 10,
    width: 150,
  },
  button: {
    margin: 10,
  },
});
