import { interpolate } from 'react-native-reanimated';
import Transition, { type ScreenTransitionConfig } from 'react-native-screen-transitions';
import { BlankStack } from 'react-native-screen-transitions/expo-router';

// Push slides in from the right, the screen below shifts left by 30%.
const slideInterpolator: ScreenTransitionConfig['screenStyleInterpolator'] = ({
  progress,
  layouts: {
    screen: { width },
  },
}) => {
  'worklet';
  return {
    content: {
      style: {
        transform: [{ translateX: interpolate(progress, [0, 1, 2], [width, 0, -width * 0.3]) }],
      },
    },
  };
};

const getIdParam = (route: { params?: object } | undefined) => {
  'worklet';
  // Route params are untyped in the interpolator.
  const id = (route?.params as { id?: unknown } | undefined)?.id;
  return typeof id === 'string' ? id : '';
};

// Zooms the tapped thumbnail into the matching boundary on the detail screen.
const zoomInterpolator: ScreenTransitionConfig['screenStyleInterpolator'] = ({
  active,
  current,
  next,
  bounds,
}) => {
  'worklet';
  const id = getIdParam(active.route) || getIdParam(next?.route) || getIdParam(current.route);
  if (!id) {
    return {};
  }
  return bounds(id).navigation.zoom({ target: 'bound' });
};

export default function Layout() {
  return (
    <BlankStack>
      <BlankStack.Screen name="index" />
      <BlankStack.Screen
        name="slide"
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          screenStyleInterpolator: slideInterpolator,
          transitionSpec: {
            open: Transition.Specs.DefaultSpec,
            close: Transition.Specs.DefaultSpec,
          },
        }}
      />
      <BlankStack.Screen name="zoom/index" />
      <BlankStack.Screen
        name="zoom/[id]"
        options={{
          navigationMaskEnabled: true,
          gestureEnabled: true,
          gestureDirection: ['bidirectional', 'pinch-in'],
          screenStyleInterpolator: zoomInterpolator,
          transitionSpec: Transition.Specs.Zoom,
        }}
      />
    </BlankStack>
  );
}
