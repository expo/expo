import * as Permissions from 'expo-permissions';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
}

const Button: React.FunctionComponent<ButtonProps> = ({ title, disabled, onPress }) => (
  <TouchableOpacity disabled={disabled} onPress={onPress}>
    <View style={[button.button, disabled && button.disabled]}>
      <Text style={button.text}>{title}</Text>
    </View>
  </TouchableOpacity>
);

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

interface State {
  permissionsFunction: 'askAsync' | 'getAsync';
}

// See: https://github.com/expo/expo/pull/10229#discussion_r490961694
// eslint-disable-next-line @typescript-eslint/ban-types
export default class PermissionsScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'Permissions',
  };

  readonly state: State = {
    permissionsFunction: 'askAsync',
  };

  invokePermissionsFunction = async (...types: Permissions.PermissionType[]) => {
    const result = await Permissions[this.state.permissionsFunction](...types);
    alert(JSON.stringify(result, null, 2));
  };

  renderSinglePermissionsButtons() {
    const permissions: [string, Permissions.PermissionType][] = [
      ['CAMERA', Permissions.CAMERA],
      ['MOTION', Permissions.MOTION],
      ['AUDIO_RECORDING', Permissions.AUDIO_RECORDING],
      ['LOCATION', Permissions.LOCATION],
      ['USER_FACING_NOTIFICATIONS', Permissions.USER_FACING_NOTIFICATIONS],
      ['NOTIFICATIONS', Permissions.NOTIFICATIONS],
      ['CONTACTS', Permissions.CONTACTS],
      ['SYSTEM_BRIGHTNESS', Permissions.SYSTEM_BRIGHTNESS],
      ['MEDIA_LIBRARY_WRITE_ONLY', Permissions.MEDIA_LIBRARY_WRITE_ONLY],
      ['MEDIA_LIBRARY', Permissions.MEDIA_LIBRARY],
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
                  ...([
                    Permissions.CAMERA,
                    Permissions.AUDIO_RECORDING,
                    Permissions.LOCATION,
                    Permissions.USER_FACING_NOTIFICATIONS,
                    Permissions.NOTIFICATIONS,
                    Permissions.CONTACTS,
                    Permissions.SYSTEM_BRIGHTNESS,
                    Permissions.MEDIA_LIBRARY,
                    Permissions.CALENDAR,
                    Permissions.REMINDERS,
                  ] as Permissions.PermissionType[])
                )
              }
              title={
                'Ask for Permissions: ' +
                'CAMERA, AUDIO_RECORDING, LOCATION, USER_FACING_NOTIFICATIONS, ' +
                'NOTIFICATIONS, CONTACTS, SYSTEM_BRIGHTNESS, MEDIA_LIBRARY, CALENDAR, REMINDERS'
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
