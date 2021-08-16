import { startActivityAsync, ActivityAction } from 'expo-intent-launcher';
import React from 'react';
import { Platform, ScrollView, Text, ToastAndroid, View } from 'react-native';

import Button from '../components/Button';

export default class IntentLauncherScreen extends React.Component {
  static navigationOptions = {
    title: 'IntentLauncher',
  };

  renderSettingsLink(title: string, activityAction: ActivityAction, intentParams = {}) {
    return (
      <View>
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
          style={{ marginBottom: 10 }}
        />
      </View>
    );
  }

  render() {
    if (Platform.OS !== 'android') {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>IntentLauncherAndroid is only available on Android.</Text>
        </View>
      );
    }

    return (
      <ScrollView style={{ padding: 10 }}>
        {this.renderSettingsLink('Location Settings', ActivityAction.LOCATION_SOURCE_SETTINGS)}

        {this.renderSettingsLink('Wireless Settings', ActivityAction.WIRELESS_SETTINGS)}

        {this.renderSettingsLink(
          'Application Details for Expo Go',
          ActivityAction.APPLICATION_DETAILS_SETTINGS,
          {
            data: 'package:host.exp.exponent',
          }
        )}

        {this.renderSettingsLink(
          'Application Details for Play Store',
          ActivityAction.APPLICATION_DETAILS_SETTINGS,
          {
            data: 'package:com.android.vending',
          }
        )}

        {this.renderSettingsLink(
          'Application Details for not existing package',
          ActivityAction.APPLICATION_DETAILS_SETTINGS,
          {
            data: 'package:package.name.that.doesnt.exist',
          }
        )}
      </ScrollView>
    );
  }
}
