import { usePermissions } from '@use-expo/permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Permissions from 'expo-permissions';
import * as ScreenOrientation from 'expo-screen-orientation';
import React from 'react';
import { Button, Platform, StyleSheet, Text, View } from 'react-native';
import * as Svg from 'react-native-svg';

const BUTTON_COLOR = Platform.OS === 'ios' ? '#fff' : '#666';

export default function BarcodeScannerExample() {
  const [type, setType] = React.useState<any>(BarCodeScanner.Constants.Type.back);
  const [alerting, setAlerting] = React.useState<boolean>(false);
  const [haveDimensions, setHaveDimensions] = React.useState<boolean>(false);
  const [canvasWidth, setCanvasWidth] = React.useState<number | undefined>();
  const [canvasHeight, setCanvasHeight] = React.useState<number | undefined>();
  const [cornerPoints, setCornerPoints] = React.useState<any[] | null>(null);
  const [boundingBox, setBoundingBox] = React.useState<{
    origin: {
      x: number;
      y: number;
    };
    size: {
      width: number;
      height: number;
    };
  } | null>(null);
  const [isPermissionsGranted] = usePermissions(Permissions.CAMERA, { ask: true });

  let canChangeOrientation = false;

  const toggleAlertingAboutResult = () => {
    setAlerting(!alerting);
  };

  const toggleScreenOrientationState = () => {
    if (canChangeOrientation) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } else {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.ALL);
    }
    canChangeOrientation = !canChangeOrientation;
  };

  const setCanvasDimensions = ({ nativeEvent: { layout } }: any) => {
    setCanvasWidth(layout.width);
    setCanvasHeight(layout.height);
    setHaveDimensions(true);
  };

  const toggleType = () =>
    setType(
      type === BarCodeScanner.Constants.Type.back
        ? BarCodeScanner.Constants.Type.front
        : BarCodeScanner.Constants.Type.back
    );

  const handleBarCodeScanned = (data: any) => {
    if (alerting) {
      requestAnimationFrame(() => {
        alert(JSON.stringify(data));
      });
    }
    setCornerPoints(data.cornerPoints);
    setBoundingBox(data.bounds);
  };

  if (!isPermissionsGranted) {
    return (
      <View style={styles.container}>
        <Text>You have not granted permission to use the camera on this device!</Text>
      </View>
    );
  }

  const circles = [];

  if (cornerPoints) {
    for (const point of cornerPoints) {
      circles.push(
        <Svg.Circle cx={point.x} cy={point.y} r={2} strokeWidth={0.1} stroke="gray" fill="green" />
      );
    }
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onLayout={setCanvasDimensions}
        onBarCodeScanned={handleBarCodeScanned}
        barCodeTypes={[
          BarCodeScanner.Constants.BarCodeType.qr,
          BarCodeScanner.Constants.BarCodeType.pdf417,
          BarCodeScanner.Constants.BarCodeType.code128,
          BarCodeScanner.Constants.BarCodeType.code39,
        ]}
        type={type}
        style={styles.preview}
      />

      {haveDimensions && (
        <Svg.Svg height={canvasHeight} width={canvasWidth} style={styles.svg}>
          <Svg.Circle
            cx={canvasWidth! / 2}
            cy={canvasHeight! / 2}
            r={2}
            strokeWidth={2.5}
            stroke="#e74c3c"
            fill="#f1c40f"
          />
          {boundingBox && (
            <Svg.Rect
              x={boundingBox.origin.x}
              y={boundingBox.origin.y}
              width={boundingBox.size.width}
              height={boundingBox.size.height}
              strokeWidth={2}
              stroke="#9b59b6"
              fill="none"
            />
          )}
          {circles}
        </Svg.Svg>
      )}

      <View style={styles.toolbar}>
        <Button color={BUTTON_COLOR} title="Direction" onPress={toggleType} />
        <Button color={BUTTON_COLOR} title="Orientation" onPress={toggleScreenOrientationState} />
        <Button color={BUTTON_COLOR} title="Alerting" onPress={toggleAlertingAboutResult} />
      </View>
    </View>
  );
}
BarcodeScannerExample.navigationOptions = {
  title: '<BarCodeScanner />',
};

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
