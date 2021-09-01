import { Picker } from '@react-native-picker/picker';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import Button from '../components/Button';
import Colors from '../constants/Colors';

const url = 'https://expo.io';
interface Package {
  label: string;
  value: string;
}

interface State {
  showTitle: boolean;
  toolbarColor?: string;
  secondaryToolbarColor?: string;
  authResult?: Record<string, string> | null;
  controlsColorText?: string;
  shouldPrompt: boolean;
  packages?: Package[];
  selectedPackage?: string;
  lastWarmedPackage?: string;
  barCollapsing: boolean;
  showInRecents: boolean;
  createTask: boolean;
  readerMode: boolean;
  enableDefaultShare: boolean;
}

// See: https://github.com/expo/expo/pull/10229#discussion_r490961694
// eslint-disable-next-line @typescript-eslint/ban-types
export default class WebBrowserScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'WebBrowser',
  };

  readonly state: State = {
    showTitle: false,
    barCollapsing: false,
    authResult: null,
    shouldPrompt: false,
    showInRecents: false,
    createTask: true,
    toolbarColor: Colors.tintColor.replace(/^#/, ''),
    controlsColorText: Colors.headerTitle.replace(/^#/, ''),
    readerMode: false,
    enableDefaultShare: false,
  };

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

  promptSwitchChanged = (shouldPrompt: boolean) => {
    this.setState({ shouldPrompt });
  };

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

  startAuthAsync = async (shouldPrompt: boolean): Promise<any> => {
    const redirectUrl = Linking.makeUrl('redirect');
    const result = await WebBrowser.openAuthSessionAsync(
      `https://fake-auth.netlify.com?state=faker&redirect_uri=${encodeURIComponent(
        redirectUrl
      )}&prompt=${shouldPrompt ? 'consent' : 'none'}`,
      redirectUrl,
      { createTask: this.state.createTask }
    );
    return result;
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
      secondaryToolbarColor:
        this.state.secondaryToolbarColor && `#${this.state.secondaryToolbarColor}`,
      controlsColor: this.state.controlsColorText && `#${this.state.controlsColorText}`,
      browserPackage: this.state.selectedPackage,
      enableBarCollapsing: this.state.barCollapsing,
      showInRecents: this.state.showInRecents,
      createTask: this.state.createTask,
      readerMode: this.state.readerMode,
      enableDefaultShareMenuItem: this.state.enableDefaultShare,
    };
    const result = await WebBrowser.openBrowserAsync(
      'https://blog.expo.io/expo-sdk-40-is-now-available-d4d73e67da33',
      args
    );
    setTimeout(() => Alert.alert('Result', JSON.stringify(result, null, 2)), 1000);
  };

  handleToolbarColorInputChanged = (toolbarColor: string) => this.setState({ toolbarColor });

  handleSecondaryToolbarColorInputChanged = (secondaryToolbarColor: string) =>
    this.setState({ secondaryToolbarColor });

  handleControlsColorInputChanged = (controlsColorText: string) =>
    this.setState({ controlsColorText });

  packageSelected = (value: string | number) => {
    if (typeof value === 'string') {
      this.setState({ selectedPackage: value });
    }
  };

  handleShowTitleChanged = (showTitle: boolean) => this.setState({ showTitle });

  handleRecents = (showInRecents: boolean) => this.setState({ showInRecents });

  handleCreateTask = (createTask: boolean) => this.setState({ createTask });

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
          <Text>Secondary toolbar color (#rrggbb):</Text>
          <TextInput
            style={styles.input}
            placeholder="RRGGBB"
            onChangeText={this.handleSecondaryToolbarColorInputChanged}
            value={this.state.secondaryToolbarColor}
          />
        </View>
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
          <Text>Create task</Text>
          <Switch
            style={styles.switch}
            onValueChange={this.handleCreateTask}
            value={this.state.createTask}
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
      <ScrollView contentContainerStyle={styles.container}>
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
        <>
          <Button
            style={styles.button}
            onPress={async () => {
              // eslint-disable-next-line react/no-access-state-in-setstate
              const authResult = await this.startAuthAsync(this.state.shouldPrompt);
              this.setState({ authResult });
            }}
            title="Open web auth session"
          />
          <View style={styles.label}>
            <Text>Should prompt</Text>
            <Switch
              style={styles.switch}
              onValueChange={this.promptSwitchChanged}
              value={this.state.shouldPrompt}
            />
          </View>
          {this.state.authResult && (
            <Text>Auth Result: {JSON.stringify(this.state.authResult, null, 2)}</Text>
          )}
        </>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
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
