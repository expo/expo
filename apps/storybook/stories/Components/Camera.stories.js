import { Camera } from 'expo-camera';
import { askAsync, CAMERA } from 'expo-permissions';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export const title = 'Camera';
export const packageJson = require('expo-camera/package.json');
export const label = 'Camera';

export class component extends React.Component {
  state = {
    hasCameraPermission: null,
    type: Camera.Constants.Type.back,
  };

  _isMounted = false;

  async componentDidMount() {
    this._isMounted = true;
    this._getPermissionAsync();
  }

  _getPermissionAsync = async () => {
    const { status } = await askAsync(CAMERA);

    if (this._isMounted) {
      this.setState({ hasCameraPermission: status === 'granted' });
    }
  };

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const { hasCameraPermission } = this.state;
    if (hasCameraPermission === null) {
      return <View />;
    } else if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>;
    } else {
      return (
        <View style={{ flex: 1 }}>
          <Camera style={{ flex: 1 }} type={this.state.type}>
            <View
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                flexDirection: 'row',
              }}>
              <TouchableOpacity
                style={{
                  flex: 0.1,
                  alignSelf: 'flex-end',
                  alignItems: 'center',
                }}
                onPress={() => {
                  this.setState({
                    type:
                      this.state.type === Camera.Constants.Type.back
                        ? Camera.Constants.Type.front
                        : Camera.Constants.Type.back,
                  });
                }}>
                <Text style={{ fontSize: 18, marginBottom: 10, color: 'white' }}> Flip </Text>
              </TouchableOpacity>
            </View>
          </Camera>
        </View>
      );
    }
  }
}
