import { BarCodeScanner, BarCodePoint, BarCodeEvent, BarCodeBounds } from 'expo-barcode-scanner';
import * as Permissions from 'expo-permissions';
import * as ScreenOrientation from 'expo-screen-orientation';
import React from 'react';
import { Button, Platform, StyleSheet, Text, View } from 'react-native';
import * as Svg from 'react-native-svg';
import { NavigationEvents } from 'react-navigation';

const BUTTON_COLOR = Platform.OS === 'ios' ? '#fff' : '#666';

interface State {
  isPermissionsGranted: boolean;
  type: any;
  cornerPoints?: BarCodePoint[];
  alerting: boolean;
  haveDimensions: boolean;
  canvasHeight?: number;
  canvasWidth?: number;
  boundingBox?: BarCodeBounds;
  cornerPointsString?: string;
  showBoundingBox: boolean;
  showText: boolean;
  data: string;
}

export default class BarcodeScannerExample extends React.Component<object, State> {
  static navigationOptions = {
    title: '<BarCodeScanner />',
  };

  canChangeOrientation = false;

  readonly state: State = {
    isPermissionsGranted: false,
    type: BarCodeScanner.Constants.Type.back,
    alerting: false,
    haveDimensions: false,
    showBoundingBox: false,
    data: '',
    showText: false,
  };

  componentDidFocus = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ isPermissionsGranted: status === 'granted' });
  };

  toggleAlertingAboutResult = () => {
    this.setState(({ alerting }) => ({
      alerting: !alerting,
    }));
  };

  toggleScreenOrientationState = () => {
    if (this.canChangeOrientation) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } else {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.ALL);
    }
    this.canChangeOrientation = !this.canChangeOrientation;
  };

  setCanvasDimensions = (e: any) => {
    this.setState({
      canvasWidth: e.nativeEvent.layout.width,
      canvasHeight: e.nativeEvent.layout.height,
      haveDimensions: true,
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

    const circles = [];

    if (this.state.cornerPoints) {
      for (const point of this.state.cornerPoints) {
        circles.push(
          <Svg.Circle
            cx={point.x}
            cy={point.y}
            r={3}
            strokeWidth={0.5}
            stroke="#CF4048"
            fill="#CF4048"
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
            BarCodeScanner.Constants.BarCodeType.code39,
          ]}
          type={this.state.type}
          style={styles.preview}
        />

        {this.state.haveDimensions && (
          <Svg.Svg
            height={this.state.canvasHeight}
            width={this.state.canvasWidth}
            style={styles.svg}>
            <Svg.Circle
              cx={this.state.canvasWidth! / 2}
              cy={this.state.canvasHeight! / 2}
              r={2}
              strokeWidth={2.5}
              stroke="#e74c3c"
              fill="#f1c40f"
            />
            {this.state.showBoundingBox && this.state.cornerPointsString && (
              <Svg.Polygon
                points={this.state.cornerPointsString}
                strokeWidth={2}
                stroke="#582E6E"
                fill="none"
              />
            )}
            {this.state.showText && this.state.boundingBox && (
              <Svg.Text
                fill="#CF4048"
                stroke="#CF4048"
                fontSize="14"
                x={this.state.boundingBox.origin.x}
                y={this.state.boundingBox.origin.y - 8}>
                {this.state.data}
              </Svg.Text>
            )}

            {circles}
          </Svg.Svg>
        )}

        <View style={styles.toolbar}>
          <Button color={BUTTON_COLOR} title="Direction" onPress={this.toggleType} />
          <Button
            color={BUTTON_COLOR}
            title="Orientation"
            onPress={this.toggleScreenOrientationState}
          />
          <Button color={BUTTON_COLOR} title="Bounding box" onPress={this.toggleBoundingBox} />
          <Button color={BUTTON_COLOR} title="Text" onPress={this.toggleText} />
          <Button color={BUTTON_COLOR} title="Alerting" onPress={this.toggleAlertingAboutResult} />
        </View>
      </View>
    );
  }

  toggleType = () =>
    this.setState(({ type }) => ({
      type:
        type === BarCodeScanner.Constants.Type.back
          ? BarCodeScanner.Constants.Type.front
          : BarCodeScanner.Constants.Type.back,
    }));

  toggleText = () =>
    this.setState(({ showText }) => ({
      showText: !showText,
    }));

  toggleBoundingBox = () =>
    this.setState(({ showBoundingBox }) => ({
      showBoundingBox: !showBoundingBox,
    }));

  getPointsString = (barCodePoints?: BarCodePoint[]): string | undefined => {
    if (!barCodePoints) {
      return;
    }
    return barCodePoints.map(({ x, y }) => `${Math.round(x)},${Math.round(y)}`).join(' ');
  };

  handleBarCodeScanned = (barCodeEvent: BarCodeEvent) => {
    if (this.state.alerting) {
      requestAnimationFrame(() => {
        alert(JSON.stringify(barCodeEvent));
      });
    }
    this.setState({
      data: barCodeEvent.data,
      cornerPoints: barCodeEvent.cornerPoints,
      boundingBox: barCodeEvent.bounds,
      cornerPointsString: this.getPointsString(barCodeEvent.cornerPoints),
    });
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
