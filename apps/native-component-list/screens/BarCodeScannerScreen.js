import React from 'react';
import { NavigationEvents } from 'react-navigation';
import { Button, Platform, StyleSheet, Text, View } from 'react-native';

import { BarCodeScanner, Permissions, Svg } from 'expo';

const BUTTON_COLOR = Platform.OS === 'ios' ? '#fff' : '#666';

const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 400;

export default class BarcodeScannerExample extends React.Component {
  static navigationOptions = {
    title: '<BarCodeScanner />',
  };

  state = {
    isPermissionsGranted: false,
    type: BarCodeScanner.Constants.Type.back,
    cornerPoints: null,
  };

  componentDidFocus = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ isPermissionsGranted: status === 'granted' });
  };

  render() {
    if (!this.state.isPermissionsGranted) {
      return (
        <View style={styles.container}>
          <NavigationEvents onDidFocus={this.componentDidFocus} />
          <Text>You have not granted permission to use the camera on this device!</Text>
        </View>
      );
    }

    let circles = [];

    if (this.state.cornerPoints != null) {
      //console.log(this.state.cornerPoints);
      //console.log('width, height ', this.state.width, this.state.height);
      for (let i = 0; i < 4; ++i) {
        let x = this.state.cornerPoints[i * 2]/this.state.width*CANVAS_WIDTH
        let y = this.state.cornerPoints[i * 2 + 1]/this.state.height*CANVAS_HEIGHT;
      //  console.log("zrobilem ", x, " ", y);
        circles.push(
          <Svg.Circle
            cx={x}
            cy={y}
            r={2}
            strokeWidth={2.5}
            stroke="#e74c3c"
            fill="#f1c40f"
          />
        );
      }
    }
    return (
      <View style={styles.container}>
        <View  height={CANVAS_HEIGHT} width={CANVAS_WIDTH} >
          <BarCodeScanner
            height={CANVAS_HEIGHT}
            width={CANVAS_WIDTH}
            onBarCodeScanned={this.handleBarCodeScanned}
            barCodeTypes={[
              BarCodeScanner.Constants.BarCodeType.qr,
              BarCodeScanner.Constants.BarCodeType.pdf417,
            ]}
            type={this.state.type}
            style={styles.preview}
          />

          <Svg height={CANVAS_HEIGHT} width={CANVAS_WIDTH} style={styles.svg}>
            <Svg.Circle cx={150} cy={200} r={2} strokeWidth={2.5} stroke="#e74c3c" fill="#f1c40f" />
            {circles}
          </Svg>
        </View>

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
    //this.props.navigation.goBack();

    //requestAnimationFrame(() => {
    //  alert(JSON.stringify(data));
  //  });
    this.setState({ cornerPoints: data.bounds, width: data.width, height: data.height});
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    left: 20,
    top: 40,
  },
  preview: {
    position: 'absolute',
    backgroundColor: 'black',
  },
  toolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  svg: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'red',
  },
});
