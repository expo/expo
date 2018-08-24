import React from 'react';
import { Platform, ScrollView, Text, ToastAndroid, View } from 'react-native';
import { IntentLauncherAndroid } from 'expo';
import Button from '../components/Button';

export default class IntentLauncherScreen extends React.Component {
  static navigationOptions = {
    title: 'IntentLauncher',
  };

  renderSettingsLink(title, activity, data = null, uri = null) {
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
              await IntentLauncherAndroid.startActivityAsync(activity, data, uri);
              ToastAndroid.show(`Activity finished`, ToastAndroid.SHORT);
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
          IntentLauncherAndroid.ACTION_LOCATION_SOURCE_SETTINGS
        )}

        {this.renderSettingsLink(
          'Application Details for Play Store',
          IntentLauncherAndroid.ACTION_APPLICATION_DETAILS_SETTINGS,
          null,
          'package:com.android.vending'
        )}
      </ScrollView>
    );
  }
}
