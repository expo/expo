import React from 'react';
import { ScrollView, View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { Permissions } from 'expo';

const CustomButton = ({ title, disabled, onPress }) => (
  <TouchableOpacity disabled={disabled} onPress={onPress}>
    <View style={[customButtonStyles.button, disabled && customButtonStyles.disabled]}>
      <Text style={customButtonStyles.text}>
        {title}
      </Text>
    </View>
  </TouchableOpacity>
);

const customButtonStyles = StyleSheet.create({
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

export default class PermissionsScreen extends React.Component {
  static navigationOptions = {
    title: 'Permissions',
  };

  state = {
    permissionsFunction: 'askAsync',
  };

  invokePermissionsFunction = async (...types) => {
    const result = await Permissions[this.state.permissionsFunction](...types);
    alert(JSON.stringify(result, null, 2));
  }

  renderSinglePermissionsButtons() {
    return [
      'CAMERA',
      'AUDIO_RECORDING',
      'LOCATION',
      'USER_FACING_NOTIFICATIONS',
      'NOTIFICATIONS',
      'CONTACTS',
      'SYSTEM_BRIGHTNESS',
      'CAMERA_ROLL',
      'CALENDAR',
      'REMINDERS',
      'SMS',
    ].map(permissionType => (
      <View
        key={permissionType}
        style={styles.button}
      >
        <CustomButton
          onPress={() => this.invokePermissionsFunction(Permissions[permissionType])}
          title={`Permissions.${permissionType}`}
        />
      </View>
    ));
  }

  render() {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View>
          <Text style={styles.switchText}>
            Function to be invoked Permissions.{this.state.permissionsFunction}
          </Text>
          <View style={styles.switchContainer}>
            <View style={styles.switchButton}>
              <CustomButton
                disabled={this.state.permissionsFunction === 'askAsync'}
                title="askAsync"
                onPress={() => this.setState({ permissionsFunction: 'askAsync'})}
              />
            </View>
            <View style={styles.switchButton}>
              <CustomButton
                disabled={this.state.permissionsFunction === 'getAsync'}
                title="getAsync"
                onPress={() => this.setState({ permissionsFunction: 'getAsync'})}
              />
            </View>
          </View>
        </View>
        <Text style={styles.header}>
          Single Permissions
        </Text>
        <View>
          {this.renderSinglePermissionsButtons()}
        </View>
        <Text style={styles.header}>
          Multiple Permissions
        </Text>
        <View>
          <View style={styles.button}>
            <CustomButton
              onPress={() => this.invokePermissionsFunction(
                ...[
                  Permissions.CAMERA,
                  Permissions.AUDIO_RECORDING,
                  (Platform.OS !== 'ios' || this.state.permissionsFunction !== 'askAsync') && Permissions.LOCATION, // TODO: Permissions.LOCATION issue (search by this phrase)
                  Permissions.USER_FACING_NOTIFICATIONS,
                  Permissions.NOTIFICATIONS,
                  Permissions.CONTACTS,
                  (Platform.OS !== 'android' || this.state.permissionsFunction !== 'askAsync') && Permissions.SYSTEM_BRIGHTNESS, // askAsync with Permissions.SYSTEM_BRIGHTNESS on Android should be called individually
                  Permissions.CAMERA_ROLL,
                  Permissions.CALENDAR,
                  Permissions.REMINDERS,
                  Permissions.SMS].filter(n => n && typeof n !== 'boolean')
              )}
              title={'Ask for Permissions: '
                + 'CAMERA, AUDIO_RECORDING, '
                + `${Platform.OS !== 'ios' || this.state.permissionsFunction !== 'askAsync' ? 'LOCATION, ' : ''}`
                + 'USER_FACING_NOTIFICATIONS, NOTIFICATIONS, CONTACTS, '
                + `${Platform.OS !== 'android' || this.state.permissionsFunction !== 'askAsync' ? `SYSTEM_BRIGHTNESS, ` : ''}`
                + 'CAMERA_ROLL, CALENDAR, REMINDERS, SMS'
              }
            />
          </View>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 10,
    padding: 10,
  },
  contentContainer: {
    alignItems: 'center'
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
