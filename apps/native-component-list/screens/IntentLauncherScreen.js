import React from 'react';
import { Platform, ScrollView, Text, ToastAndroid, View } from 'react-native';
import { IntentLauncher } from 'expo';
import Button from '../components/Button';

export default class IntentLauncherScreen extends React.Component {
  static navigationOptions = {
    title: 'IntentLauncher',
  };

  renderSettingsLink(title, activityAction, intentParams = {}) {
    if (Platform.OS !== 'android') {
      return (
        <View>
          <Text>IntentLauncherAndroid is only available on Android.</Text>
        </View>
      );
    }
    return (
      <View>
        <Button
          onPress={async () => {
            try {
              const result = await IntentLauncher.startActivityAsync(activityAction, intentParams);
              ToastAndroid.show(`Activity finished: ${JSON.stringify(result)}`, ToastAndroid.SHORT);
            } catch (e) {
              ToastAndroid.show(`An error occurred: ${e.message}`, ToastAndroid.SHORT);
            }
          }}
          title={title}
          style={{ marginBottom: 10 }}
        />
      </View>
    );
  }

  render() {
    return (
      <ScrollView style={{ padding: 10 }}>
        {this.renderSettingsLink(
          'Location Settings',
          IntentLauncher.ACTION_LOCATION_SOURCE_SETTINGS
        )}

        {this.renderSettingsLink('Wireless Settings', IntentLauncher.ACTION_WIRELESS_SETTINGS)}

        {this.renderSettingsLink(
          'Application Details for Expo Client',
          IntentLauncher.ACTION_APPLICATION_DETAILS_SETTINGS,
          {
            data: 'package:host.exp.exponent',
          }
        )}

        {this.renderSettingsLink(
          'Application Details for Play Store',
          IntentLauncher.ACTION_APPLICATION_DETAILS_SETTINGS,
          {
            data: 'package:com.android.vending',
          }
        )}

        {this.renderSettingsLink(
          'Application Details for not existing package',
          IntentLauncher.ACTION_APPLICATION_DETAILS_SETTINGS,
          {
            data: 'package:package.name.that.doesnt.exist',
          }
        )}
      </ScrollView>
    );
  }
}
