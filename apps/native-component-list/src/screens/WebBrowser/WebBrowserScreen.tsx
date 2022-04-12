import { Picker } from '@react-native-picker/picker';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import OpenAuthSessionAsyncDemo from './OpenAuthSessionAsyncDemo';
import OpenBrowserAsyncDemo from './OpenBrowserAsyncDemo';

const url = 'https://expo.dev';
interface Package {
  label: string;
  value: string;
}

interface State {
  packages?: Package[];
  selectedPackage?: string;
  lastWarmedPackage?: string;
}

// See: https://github.com/expo/expo/pull/10229#discussion_r490961694
// eslint-disable-next-line @typescript-eslint/ban-types
export default class WebBrowserScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'WebBrowser',
  };

  readonly state: State = {};

  componentDidMount() {
    if (Platform.OS === 'android') {
      WebBrowser.getCustomTabsSupportingBrowsersAsync()
        .then(({ browserPackages }) =>
          browserPackages.map((name) => ({ label: name, value: name }))
        )
        .then((packages) => this.setState({ packages }));
    }
  }

  componentWillUnmount() {
    if (Platform.OS === 'android') {
      WebBrowser.coolDownAsync(this.state.lastWarmedPackage);
    }
  }

  showPackagesAlert = async () => {
    const result = await WebBrowser.getCustomTabsSupportingBrowsersAsync();
    Alert.alert('Result', JSON.stringify(result, null, 2));
  };

  handleWarmUpClicked = async () => {
    const { selectedPackage: lastWarmedPackage } = this.state;
    this.setState({
      lastWarmedPackage,
    });
    const result = await WebBrowser.warmUpAsync(lastWarmedPackage);
    Alert.alert('Result', JSON.stringify(result, null, 2));
  };

  handleMayInitWithUrlClicked = async () => {
    const { selectedPackage: lastWarmedPackage } = this.state;
    this.setState({
      lastWarmedPackage,
    });
    const result = await WebBrowser.mayInitWithUrlAsync(url, lastWarmedPackage);
    Alert.alert('Result', JSON.stringify(result, null, 2));
  };

  handleCoolDownClicked = async () => {
    const result = await WebBrowser.coolDownAsync(this.state.selectedPackage);
    Alert.alert('Result', JSON.stringify(result, null, 2));
  };

  packageSelected = (value: string | number) => {
    if (typeof value === 'string') {
      this.setState({ selectedPackage: value });
    }
  };

  renderAndroidChoices = () =>
    Platform.OS === 'android' && (
      <>
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
      <>
        <Button style={styles.button} onPress={this.handleWarmUpClicked} title="Warm up." />
        <Button
          style={styles.button}
          onPress={this.handleMayInitWithUrlClicked}
          title="May init with url."
        />
        <Button style={styles.button} onPress={this.handleCoolDownClicked} title="Cool down." />
        <Button
          style={styles.button}
          onPress={this.showPackagesAlert}
          title="Show supporting browsers."
        />
      </>
    );

  render() {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <OpenBrowserAsyncDemo />
        <OpenAuthSessionAsyncDemo />
        {this.renderAndroidButtons()}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  label: {
    paddingBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  picker: {
    padding: 10,
    width: 150,
  },
  button: {
    marginVertical: 10,
    alignItems: 'flex-start',
  },
});
