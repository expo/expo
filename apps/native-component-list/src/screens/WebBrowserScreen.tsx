import React from 'react';
import { Alert, View, StyleSheet, Text, Switch, TextInput, Picker, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import Colors from '../constants/Colors';
import Button from '../components/Button';

const url = 'https://expo.io';
interface Package {
  label: string;
  value: string;
}

interface State {
  showTitle: boolean;
  toolbarColor?: string;
  controlsColorText?: string;
  packages?: Package[];
  selectedPackage?: string;
  lastWarmedPackage?: string;
  barCollapsing: boolean;
  showInRecents: boolean;
  readerMode: boolean;
  enableDefaultShare: boolean;
}

export default class WebBrowserScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'WebBrowser',
  };

  readonly state: State = {
    showTitle: false,
    barCollapsing: false,
    showInRecents: false,
    toolbarColor: Colors.tintColor.replace(/^#/, ''),
    controlsColorText: Colors.headerTitle.replace(/^#/, ''),
  };

  componentDidMount() {
    if (Platform.OS === 'android') {
      WebBrowser.getCustomTabsSupportingBrowsersAsync()
        .then(({ browserPackages }) => browserPackages.map(name => ({ label: name, value: name })))
        .then(packages => this.setState({ packages }));
    }
  }

  componentWillUnmount() {
    if (Platform.OS === 'android') {
      WebBrowser.coolDownAsync(this.state.lastWarmedPackage);
    }
  }

  barCollapsingSwitchChanged = (barCollapsing: boolean) => {
    this.setState({ barCollapsing });
  };

  readerModeSwitchChanged = (readerMode: boolean) => {
    this.setState({ readerMode });
  };

  enableDefaultShareChanged = (enableDefaultShare: boolean) => {
    this.setState({ enableDefaultShare });
  };

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

  handleOpenWebUrlClicked = async () => {
    const args = {
      showTitle: this.state.showTitle,
      toolbarColor: this.state.toolbarColor && `#${this.state.toolbarColor}`,
      controlsColor: this.state.controlsColorText && `#${this.state.controlsColorText}`,
      browserPackage: this.state.selectedPackage,
      enableBarCollapsing: this.state.barCollapsing,
      showInRecents: this.state.showInRecents,
      readerMode: this.state.readerMode,
      enableDefaultShare: this.state.enableDefaultShare,
    };
    const result = await WebBrowser.openBrowserAsync('https://expo.io', args);
    setTimeout(() => Alert.alert('Result', JSON.stringify(result, null, 2)), 1000);
  };

  handleToolbarColorInputChanged = (toolbarColor: string) => this.setState({ toolbarColor });

  handleControlsColorInputChanged = (controlsColorText: string) =>
    this.setState({ controlsColorText });

  packageSelected = (value: string) => {
    this.setState({ selectedPackage: value });
  };

  handleShowTitleChanged = (showTitle: boolean) => this.setState({ showTitle });

  handleRecents = (showInRecents: boolean) => this.setState({ showInRecents });

  renderIOSChoices = () =>
    Platform.OS === 'ios' && (
      <>
        <View style={styles.label}>
          <Text>Controls color (#rrggbb):</Text>
          <TextInput
            style={styles.input}
            placeholder="RRGGBB"
            onChangeText={this.handleControlsColorInputChanged}
            value={this.state.controlsColorText}
          />
        </View>
        <View style={styles.label}>
          <Text>Reader mode</Text>
          <Switch
            style={styles.switch}
            onValueChange={this.readerModeSwitchChanged}
            value={this.state.readerMode}
          />
        </View>
      </>
    );

  renderAndroidChoices = () =>
    Platform.OS === 'android' && (
      <>
        <View style={styles.label}>
          <Text>Show Title</Text>
          <Switch
            style={styles.switch}
            onValueChange={this.handleShowTitleChanged}
            value={this.state.showTitle}
          />
        </View>
        <View style={styles.label}>
          <Text>Recents</Text>
          <Switch
            style={styles.switch}
            onValueChange={this.handleRecents}
            value={this.state.showInRecents}
          />
        </View>
        <View style={styles.label}>
          <Text>Default share</Text>
          <Switch
            style={styles.switch}
            onValueChange={this.enableDefaultShareChanged}
            value={this.state.enableDefaultShare}
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
      <View style={styles.container}>
        <View style={styles.label}>
          <Text>Toolbar color (#rrggbb):</Text>
          <TextInput
            style={styles.input}
            placeholder="RRGGBB"
            onChangeText={this.handleToolbarColorInputChanged}
            value={this.state.toolbarColor}
          />
        </View>
        {this.renderIOSChoices()}
        {this.renderAndroidChoices()}
        <View style={styles.label}>
          <Text>Bar collapsing</Text>
          <Switch
            style={styles.switch}
            onValueChange={this.barCollapsingSwitchChanged}
            value={this.state.barCollapsing}
          />
        </View>
        <Button style={styles.button} onPress={this.handleOpenWebUrlClicked} title="Open web url" />
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
