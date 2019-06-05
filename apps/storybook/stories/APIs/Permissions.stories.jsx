import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Permissions from 'expo-permissions';

export const title = 'Permissions';
export const label = 'Permissions';

export const packageJson = require('expo-permissions/package.json');
export const description = `When it comes to adding functionality that can access potentially sensitive information on
a user's device, such as their location, or possibly send them possibly unwanted push
notifications, you will need to ask the user for their permission first. Unless you've
already asked their permission, then no need. And so we have the \`Permissions\` module. If
you are deploying your app to the Apple iTunes Store, you should consider adding
additional metadata to your app in order to customize the system permissions dialog and
explain why your app requires permissions. See more info in the [App Store Deployment
Guide](../../distribution/app-stores/#system-permissions-dialogs-on-ios).`;

const Button = ({ title, disabled, onPress }) => (
  <TouchableOpacity disabled={disabled} onPress={onPress}>
    <View style={[button.button, disabled && button.disabled]}>
      <Text style={button.text}>{title}</Text>
    </View>
  </TouchableOpacity>
);

export class component extends React.Component {
  state = {
    permissionsFunction: 'askAsync',
  };

  invokePermissionsFunction = async (...types) => {
    const result = await Permissions[this.state.permissionsFunction](...types);
    alert(JSON.stringify(result, null, 2));
  };

  renderSinglePermissionsButtons() {
    const permissions = [
      ['CAMERA', Permissions.CAMERA],
      ['AUDIO_RECORDING', Permissions.AUDIO_RECORDING],
      ['LOCATION', Permissions.LOCATION],
      ['USER_FACING_NOTIFICATIONS', Permissions.USER_FACING_NOTIFICATIONS],
      ['NOTIFICATIONS', Permissions.NOTIFICATIONS],
      ['CONTACTS', Permissions.CONTACTS],
      ['SYSTEM_BRIGHTNESS', Permissions.SYSTEM_BRIGHTNESS],
      ['CAMERA_ROLL', Permissions.CAMERA_ROLL],
      ['CALENDAR', Permissions.CALENDAR],
      ['REMINDERS', Permissions.REMINDERS],
    ];
    return permissions.map(([permissionName, permissionType]) => (
      <View key={permissionType} style={styles.button}>
        <Button
          onPress={() => this.invokePermissionsFunction(permissionType)}
          title={`Permissions.${permissionName}`}
        />
      </View>
    ));
  }

  render() {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View>
          <Text style={styles.switchText}>
            Function to be invoked Permissions.
            {this.state.permissionsFunction}
          </Text>
          <View style={styles.switchContainer}>
            <View style={styles.switchButton}>
              <Button
                disabled={this.state.permissionsFunction === 'askAsync'}
                title="askAsync"
                onPress={() => this.setState({ permissionsFunction: 'askAsync' })}
              />
            </View>
            <View style={styles.switchButton}>
              <Button
                disabled={this.state.permissionsFunction === 'getAsync'}
                title="getAsync"
                onPress={() => this.setState({ permissionsFunction: 'getAsync' })}
              />
            </View>
          </View>
        </View>
        <Text style={styles.header}>Single Permissions</Text>
        <View>{this.renderSinglePermissionsButtons()}</View>
        <Text style={styles.header}>Multiple Permissions</Text>
        <View>
          <View style={styles.button}>
            <Button
              onPress={() =>
                this.invokePermissionsFunction(
                  ...[
                    Permissions.CAMERA,
                    Permissions.AUDIO_RECORDING,
                    Permissions.LOCATION,
                    Permissions.USER_FACING_NOTIFICATIONS,
                    Permissions.NOTIFICATIONS,
                    Permissions.CONTACTS,
                    Permissions.SYSTEM_BRIGHTNESS,
                    Permissions.CAMERA_ROLL,
                    Permissions.CALENDAR,
                    Permissions.REMINDERS,
                  ]
                )
              }
              title={
                'Ask for Permissions: ' +
                'CAMERA, AUDIO_RECORDING, LOCATION, USER_FACING_NOTIFICATIONS, ' +
                'NOTIFICATIONS, CONTACTS, SYSTEM_BRIGHTNESS, CAMERA_ROLL, CALENDAR, REMINDERS'
              }
            />
          </View>
        </View>
      </ScrollView>
    );
  }
}

const button = StyleSheet.create({
  button: {
    backgroundColor: '#02735E',
    borderRadius: 5,
  },
  text: {
    color: 'white',
    textAlign: 'center',
    padding: 8,
    fontSize: 16,
  },
  disabled: {
    backgroundColor: '#90A3BF',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 10,
    padding: 10,
  },
  contentContainer: {
    alignItems: 'center',
  },
  button: {
    padding: 10,
    marginBottom: 10,
  },
  header: {
    color: '#F27127',
    fontSize: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#F27127',
    marginBottom: 5,
  },
  switchContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  switchText: {
    marginBottom: 5,
    fontSize: 16,
  },
  switchButton: {
    flex: 1,
    margin: 3,
  },
});
