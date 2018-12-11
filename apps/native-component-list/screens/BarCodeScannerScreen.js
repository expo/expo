import React from 'react';
import { NavigationEvents } from 'react-navigation';
import { Button, Platform, StyleSheet, Text, View, ScrollView } from 'react-native';

import { BarCodeScanner, Permissions, Svg, ScreenOrientation } from 'expo';

const BUTTON_COLOR = Platform.OS === 'ios' ? '#fff' : '#666';

export default class BarcodeScannerExample extends React.Component {
  static navigationOptions = {
    title: '<BarCodeScanner />',
  };

  canChangeOrientation = false;

  state = {
    isPermissionsGranted: false,
    type: BarCodeScanner.Constants.Type.back,
    cornerPoints: null,
    alerting: false,
  };

  componentDidFocus = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ isPermissionsGranted: status === 'granted' });
  };

  toggleAlertingAboutResult = () => {
    this.setState({ alerting: !this.state.aleting });
  };

  toggleScreenOrientationState = () => {
    if (this.canChangeOrientation) {
      ScreenOrientation.allowAsync(ScreenOrientation.Orientation.PORTRAIT_UP);
    } else {
      ScreenOrientation.allowAsync(ScreenOrientation.Orientation.ALL);
    }
    this.canChangeOrientation = !this.canChangeOrientation;
  };

  setCanvasDimensions = e => {
    this.setState({
      canvasWidth: e.nativeEvent.layout.width,
      canvasHeight: e.nativeEvent.layout.height,
      haveDimensions: true,
      verbose: false,
    });
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
      for (let point of this.state.cornerPoints) {
        circles.push(
          <Svg.Circle
            cx={point.x}
            cy={point.y}
            r={2}
            strokeWidth={0.1}
            stroke="gray"
            fill="green"
          />
        );
      }
    }

    return (
      <View style={styles.container}>
        <BarCodeScanner
          onLayout={this.setCanvasDimensions}
          onBarCodeScanned={this.handleBarCodeScanned}
          barCodeTypes={[
            BarCodeScanner.Constants.BarCodeType.qr,
            BarCodeScanner.Constants.BarCodeType.pdf417,
            BarCodeScanner.Constants.BarCodeType.code128,
          ]}
          type={this.state.type}
          style={styles.preview}
        />

        {this.state.haveDimensions && (
          <Svg height={this.state.canvasHeight} width={this.state.canvasWidth} style={styles.svg}>
            <Svg.Circle
              cx={this.state.canvasWidth / 2}
              cy={this.state.canvasHeight / 2}
              r={2}
              strokeWidth={2.5}
              stroke="#e74c3c"
              fill="#f1c40f"
            />
            {this.state.boundingBox && (
              <Svg.Rect
                x={this.state.boundingBox.origin.x}
                y={this.state.boundingBox.origin.y}
                width={this.state.boundingBox.size.width}
                height={this.state.boundingBox.size.height}
                strokeWidth={2}
                stroke="#9b59b6"
                fill="none"
              />
            )}
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
    if (this.state.alerting) {
      requestAnimationFrame(() => {
        alert(JSON.stringify(data));
      });
    }
    this.setState({ cornerPoints: data.cornerPoints, boundingBox: data.bounds});
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
