import { BarCodeScanner, BarCodePoint, BarCodeBounds } from 'expo-barcode-scanner';
import * as ScreenOrientation from 'expo-screen-orientation';
import React from 'react';
import { Button, Platform, StyleSheet, Text, View } from 'react-native';
import * as Svg from 'react-native-svg';

const BUTTON_COLOR = Platform.OS === 'ios' ? '#fff' : '#666';

type State = {
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
};

const initialState: State = {
  type: BarCodeScanner.Constants.Type.back,
  alerting: false,
  haveDimensions: false,
  showBoundingBox: false,
  data: '',
  showText: false,
};

function reducer(state: State, action: Partial<State>): State {
  return {
    ...state,
    ...action,
  };
}

export default function BarcodeScannerScreen() {
  const [permission, requestPermission] = BarCodeScanner.usePermissions();

  if (!permission) {
    return null;
  }

  if (permission.granted) {
    return <BarcodeScannerExample />;
  }

  return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ margin: 16 }}>
        You have not granted permission to use the camera on this device!
      </Text>
      <Button onPress={requestPermission} title="Grant permission" />
    </View>
  );
}

function BarcodeScannerExample() {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  let canChangeOrientation = false;

  const toggleAlertingAboutResult = () => {
    dispatch({ alerting: !state.alerting });
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
    dispatch({ canvasWidth: layout.width, canvasHeight: layout.height, haveDimensions: true });
  };

  const toggleType = () => {
    dispatch({
      type:
        state.type === BarCodeScanner.Constants.Type.back
          ? BarCodeScanner.Constants.Type.front
          : BarCodeScanner.Constants.Type.back,
    });
  };

  const handleBarCodeScanned = (barCodeEvent: any) => {
    if (state.alerting) {
      requestAnimationFrame(() => {
        alert(JSON.stringify(barCodeEvent));
      });
    }
    dispatch({
      data: barCodeEvent.data,
      cornerPoints: barCodeEvent.cornerPoints,
      boundingBox: barCodeEvent.bounds,
      cornerPointsString: getPointsString(barCodeEvent.cornerPoints),
    });
  };

  const toggleText = () => dispatch({ showText: !state.showText });

  const toggleBoundingBox = () => dispatch({ showBoundingBox: !state.showBoundingBox });

  const getPointsString = (barCodePoints?: BarCodePoint[]): string | undefined => {
    if (!barCodePoints) {
      return;
    }
    return barCodePoints.map(({ x, y }) => `${Math.round(x)},${Math.round(y)}`).join(' ');
  };

  const circles = (state.cornerPoints || []).map((point, index) => (
    <Svg.Circle
      cx={point.x}
      cy={point.y}
      r={3}
      strokeWidth={0.5}
      stroke="#CF4048"
      fill="#CF4048"
      key={index}
    />
  ));

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
        type={state.type}
        style={styles.preview}
      />

      {state.haveDimensions && (
        <Svg.Svg height={state.canvasHeight} width={state.canvasWidth} style={styles.svg}>
          <Svg.Circle
            cx={state.canvasWidth! / 2}
            cy={state.canvasHeight! / 2}
            r={2}
            strokeWidth={2.5}
            stroke="#e74c3c"
            fill="#f1c40f"
          />
          {state.showBoundingBox && state.cornerPointsString && (
            <Svg.Polygon
              points={state.cornerPointsString}
              strokeWidth={2}
              stroke="#582E6E"
              fill="none"
            />
          )}
          {state.showText && state.boundingBox && (
            <Svg.Text
              fill="#CF4048"
              stroke="#CF4048"
              fontSize="14"
              x={state.boundingBox.origin.x}
              y={state.boundingBox.origin.y - 8}>
              {state.data}
            </Svg.Text>
          )}

          {circles}
        </Svg.Svg>
      )}

      <View style={styles.toolbar}>
        <Button color={BUTTON_COLOR} title="Direction" onPress={toggleType} />
        <Button color={BUTTON_COLOR} title="Orientation" onPress={toggleScreenOrientationState} />
        <Button
          title="Bounding box"
          onPress={toggleBoundingBox}
          color={state.showBoundingBox ? undefined : BUTTON_COLOR}
        />
        <Button
          title="Text"
          onPress={toggleText}
          color={state.showText ? undefined : BUTTON_COLOR}
        />
        <Button
          title="Alerting"
          onPress={toggleAlertingAboutResult}
          color={state.alerting ? undefined : BUTTON_COLOR}
        />
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
