import React from 'react';
import { NavigationEvents } from 'react-navigation';
import { Button, Platform, StyleSheet, Text, View, ScrollView } from 'react-native';

import { BarCodeScanner, Permissions, Svg, ScreenOrientation } from 'expo';

const BUTTON_COLOR = Platform.OS === 'ios' ? '#fff' : '#666';

export default class BarcodeScannerExample extends React.Component {
  static navigationOptions = {
    title: '<BarCodeScanner />',
  };

  state = {
    isPermissionsGranted: false,
    type: BarCodeScanner.Constants.Type.back,
    cornerPoints: null,
  };

  temp = 1;

  componentDidMount() {
    if (this.temp) {
      ScreenOrientation.allowAsync(ScreenOrientation.Orientation.ALL); this.temp--;
    }
  }

  componentDidFocus = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ isPermissionsGranted: status === 'granted' });
  };

  setCanvasDimentions = e => {
    this.setState({
      canvasWidth: e.nativeEvent.layout.width,
      canvasHeight: e.nativeEvent.layout.height,
      haveDimentions: true
    });
  }

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
        let x = (this.state.cornerPoints[i * 2] / this.state.width) * this.state.canvasWidth;
        let y = (this.state.cornerPoints[i * 2 + 1] / this.state.height) * this.state.canvasHeight;
      //  console.log("zrobilem ", x, " ", y);
        circles.push(
          <Svg.Circle cx={x} cy={y} r={2} strokeWidth={0.1} stroke="gray" fill="green" />
        );
      }
    }

    return (
      <View style={styles.container}>
        <BarCodeScanner
          onLayout={this.setCanvasDimentions}
          onBarCodeScanned={this.handleBarCodeScanned}
          barCodeTypes={[
            BarCodeScanner.Constants.BarCodeType.qr,
            BarCodeScanner.Constants.BarCodeType.pdf417,
            BarCodeScanner.Constants.BarCodeType.code128,
          ]}
          type={this.state.type}
          style={styles.preview}
        />

        {this.state.haveDimentions && (
          <Svg height={this.state.canvasHeight} width={this.state.canvasWidth} style={styles.svg}>
            <Svg.Circle
              cx={this.state.canvasWidth / 2}
              cy={this.state.canvasHeight / 2}
              r={2}
              strokeWidth={2.5}
              stroke="#e74c3c"
              fill="#f1c40f"
            />
            {circles}
          </Svg>
        )}

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
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
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
  svg: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'red',
  },
});
