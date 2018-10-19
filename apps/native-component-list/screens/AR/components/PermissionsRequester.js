import React from 'react';
import { View, Text, Button } from 'react-native';
import { PropTypes } from 'prop-types';
import { Permissions } from 'expo';

export default class PermissionsRequester extends React.Component {
  static propTypes = {
    permissionsTypes: PropTypes.array.isRequired,
  };

  state = {
    permissionsGranted: undefined,
  };

  componentDidMount() {
    this.askForPermissions();
  }

  askForPermissions = async () => {
    const { status } = await Permissions.askAsync(...this.props.permissionsTypes);
    this.setState({ permissionsGranted: status === 'granted' });
  }

  render() {
    const { permissionsGranted } = this.state;
    if (permissionsGranted !== false && permissionsGranted !== true) {
      return (
        <View>
          <Text>Asking for permissions {this.props.permissionsTypes}</Text>
        </View>
      );
    }

    if (permissionsGranted === false) {
      return (
        <View>
          <Text>Following permissions not granted {this.props.permissionsTypes}</Text>
          <Button title="Ask again" onPress={this.askForPermissions} />
        </View>
      );
    }

    return this.props.children;
  }
}
