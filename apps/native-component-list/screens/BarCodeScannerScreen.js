import React from 'react';
import { Button, Platform, StyleSheet, Text, View } from 'react-native';

import { BarCodeScanner, Permissions } from 'expo';

const BUTTON_COLOR = Platform.OS === 'ios' ? '#fff' : '#666';

export default class BarcodeScannerExample extends React.Component {
  static navigationOptions = {
    title: '<BarCodeScanner />',
  };

  state = {
    isPermissionsGranted: false,
    type: BarCodeScanner.Constants.Type.back,
  };

  async componentDidMount() {
    let { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ isPermissionsGranted: (status === 'granted') });
  }

  render() {
    if (!this.state.isPermissionsGranted) {
      return (
        <View style={styles.container}>
          <Text>You have not granted permission to use the camera on this device!</Text>
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <BarCodeScanner
          onBarCodeScanned={this.handleBarCodeScanned}
          barCodeTypes={[
            BarCodeScanner.Constants.BarCodeType.qr,
            BarCodeScanner.Constants.BarCodeType.pdf417,
          ]}
          type={this.state.type}
          style={styles.preview}
        />

        <View style={styles.toolbar}>
          <Button color={BUTTON_COLOR} title="Toggle Direction" onPress={this.toggleType} />
        </View>
      </View>
    );
  }

  toggleType = () => this.setState({ type:
    this.state.type === BarCodeScanner.Constants.Type.back
      ? BarCodeScanner.Constants.Type.front
      : BarCodeScanner.Constants.Type.back,
    });

  handleBarCodeScanned = data => {
    this.props.navigation.goBack();
    requestAnimationFrame(() => {
      alert(JSON.stringify(data));
    });
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
  },
  toolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
