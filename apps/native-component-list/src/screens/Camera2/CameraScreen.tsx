import * as React from 'react';
import { StyleSheet, Text, View, Button, StatusBar } from 'react-native';
import * as Permissions from 'expo-permissions';

import Camera from './Camera';

interface State {
  permissionsGranted?: boolean,
}

export default class CameraScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'Camera2Screen',
  };

  readonly state: State = {}

  componentDidMount() {
    this.askForPermissions();
    StatusBar.setHidden(true);
  }

  askForPermissions = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA)
    const permissionsGranted = status === 'granted'
    this.setState({ permissionsGranted })
  }

  render() {
    const { permissionsGranted } = this.state
    if (permissionsGranted === undefined) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>Asking for permissions ...</Text>
        </View>
      )
    }

    if (!permissionsGranted) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>No permissions!</Text>
          <Button onPress={this.askForPermissions} title="Ask again!"/>
        </View>
      )
    }

    return (
      <Camera />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF'
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10
  },
});
