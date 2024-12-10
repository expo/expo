import {
  startActivityAsync,
  ActivityAction,
  openApplication,
  getApplicationIconAsync,
} from 'expo-intent-launcher';
import React from 'react';
import { Platform, ScrollView, Text, ToastAndroid, View, Image, StyleSheet } from 'react-native';

import Button from '../components/Button';

export default class IntentLauncherScreen extends React.Component {
  static navigationOptions = {
    title: 'IntentLauncher',
  };

  state = {
    appIconBase64: '',
  };

  renderSettingsLink(title: string, activityAction: ActivityAction, intentParams = {}) {
    return (
      <View style={styles.section}>
        <Button
          onPress={async () => {
            try {
              const result = await startActivityAsync(activityAction, intentParams);
              ToastAndroid.show(`Activity finished: ${JSON.stringify(result)}`, ToastAndroid.SHORT);
            } catch (e) {
              ToastAndroid.show(`An error occurred: ${e.message}`, ToastAndroid.SHORT);
            }
          }}
          title={title}
        />
      </View>
    );
  }

  renderOpenApplicationButton(title: string, packageName: string) {
    return (
      <View style={styles.section}>
        <Button
          onPress={() => {
            try {
              openApplication(packageName);
              // This directly attempts to open the app (if available).
              // If the app doesn't exist, an error should be thrown.
            } catch (e) {
              ToastAndroid.show(`Error opening the app: ${e.message}`, ToastAndroid.SHORT);
            }
          }}
          title={title}
        />
      </View>
    );
  }

  renderGetAppIconButton(title: string, packageName: string) {
    return (
      <View style={styles.section}>
        <Button
          onPress={async () => {
            try {
              const iconBase64 = await getApplicationIconAsync(packageName);
              if (iconBase64) {
                this.setState({ appIconBase64: iconBase64 });
                ToastAndroid.show('App icon loaded!', ToastAndroid.SHORT);
              } else {
                ToastAndroid.show('No icon found.', ToastAndroid.SHORT);
              }
            } catch (e) {
              ToastAndroid.show(`Error loading the icon: ${e.message}`, ToastAndroid.SHORT);
            }
          }}
          title={title}
        />
      </View>
    );
  }

  renderAppIcon() {
    if (this.state.appIconBase64) {
      return (
        <View style={styles.iconContainer}>
          <Text>Loaded App Icon:</Text>
          <Image
            source={{ uri: this.state.appIconBase64 }}
            style={{ width: 64, height: 64, marginVertical: 10 }}
            resizeMode="contain"
          />
        </View>
      );
    }
    return null;
  }

  render() {
    if (Platform.OS !== 'android') {
      return (
        <View style={styles.centered}>
          <Text>IntentLauncherAndroid is only available on Android.</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.container}>
        {this.renderSettingsLink('Location Settings', ActivityAction.LOCATION_SOURCE_SETTINGS)}
        {this.renderSettingsLink('Wireless Settings', ActivityAction.WIRELESS_SETTINGS)}
        {this.renderSettingsLink(
          'Application Details for Expo Go',
          ActivityAction.APPLICATION_DETAILS_SETTINGS,
          { data: 'package:host.exp.exponent' }
        )}
        {this.renderSettingsLink(
          'Application Details for Play Store',
          ActivityAction.APPLICATION_DETAILS_SETTINGS,
          { data: 'package:com.android.vending' }
        )}
        {this.renderSettingsLink(
          'Application Details for a non-existing package',
          ActivityAction.APPLICATION_DETAILS_SETTINGS,
          { data: 'package:package.name.that.doesnt.exist' }
        )}
        {this.renderOpenApplicationButton('Open Play Store', 'com.android.vending')}
        {this.renderGetAppIconButton('Load Play Store Icon', 'com.android.vending')}
        {this.renderAppIcon()}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
});
