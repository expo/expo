import { StyleSheet, View } from 'react-native';
import {
  GestureDetector,
  useCompetingGestures,
  usePanGesture,
  usePinchGesture,
  useRotationGesture,
  useSimultaneousGestures,
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

function PinchableBox() {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);
  const tilt = useSharedValue(0);
  const savedTilt = useSharedValue(0);

  const pinch = usePinchGesture({
    onUpdate: (event) => {
      scale.value = savedScale.value * event.scale;
    },
    onDeactivate: () => {
      savedScale.value = scale.value;
    },
  });

  const rotate = useRotationGesture({
    onUpdate: (event) => {
      rotation.value = savedRotation.value + event.rotation;
    },
    onDeactivate: () => {
      savedRotation.value = rotation.value;
    },
  });

  const tiltPan = usePanGesture({
    minDistance: 10,
    minPointers: 2,
    maxPointers: 2,
    averageTouches: true,
    onUpdate: (event) => {
      tilt.value = savedTilt.value + event.translationY;
    },
    onDeactivate: () => {
      savedTilt.value = tilt.value;
    },
  });

  const pinchAndRotate = useSimultaneousGestures(pinch, rotate);
  const gesture = useCompetingGestures(tiltPan, pinchAndRotate);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 200 },
      { scale: scale.value },
      { rotate: `${rotation.value}rad` },
      { rotateX: `${interpolate(tilt.value, [-500, 0], [1, 0], Extrapolation.CLAMP)}rad` },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={styles.container} collapsable={false}>
        <Animated.Image
          style={[styles.pinchableImage, animatedStyle]}
          source={require('../../assets/images/swmansion.png')}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const GestureHandlerPinchScreen = () => (
  <View style={{ flex: 1 }}>
    <PinchableBox />
    <PinchableBox />
  </View>
);

GestureHandlerPinchScreen.navigationOptions = {
  title: 'Pinch and Rotate',
};

export default GestureHandlerPinchScreen;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'black',
    overflow: 'hidden',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  pinchableImage: {
    width: 250,
    height: 250,
  },
});
