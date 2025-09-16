import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'ThemeProvider';
import * as React from 'react';

import getStackNavWithConfig from './StackConfig';
import { optionalRequire, routeFilterForE2e } from './routeBuilder';
import { TabBackground } from '../components/TabBackground';
import TabIcon from '../components/TabIcon';
import { Layout } from '../constants';
import { CameraScreens } from '../screens/Camera/CameraScreen';
import ExpoComponents from '../screens/ExpoComponentsScreen';
import { MapsScreens } from '../screens/ExpoMaps/MapsScreen';
import { GLScreens } from '../screens/GL/GLScreen';
import { ImageScreens } from '../screens/Image/ImageScreen';
import { SVGScreens } from '../screens/SVG/SVGScreen';
import { UIScreens } from '../screens/UI/UIScreen';
import { VideoScreens } from '../screens/Video/VideoScreen';
import { type ScreenApiItem, type ScreenConfig } from '../types/ScreenConfig';

const Stack = createNativeStackNavigator();

const ScreensList: ScreenConfig[] = [
  {
    getComponent() {
      return optionalRequire(() => require('../screens/DrawerLayoutAndroidScreen'));
    },
    name: 'DrawerLayoutAndroid',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/ModalScreen'));
    },
    name: 'Modal',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/ScrollViewScreen'));
    },
    name: 'ScrollView',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/MaskedViewScreen'));
    },
    name: 'MaskedView',
    options: { title: 'Basic Mask Example' },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/BlurView/BlurViewScreen'));
    },
    name: 'BlurView',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/GlassView/GlassViewScreen'));
    },
    name: 'GlassView',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/Camera/CameraScreen'));
    },
    name: 'Camera',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/TextScreen'));
    },
    name: 'Text',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/TextInputScreen'));
    },
    name: 'TextInput',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/TouchablesScreen'));
    },
    name: 'Touchables',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/TouchableBounceScreen'));
    },
    name: 'TouchableBounce',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/SwitchScreen'));
    },
    name: 'Switch',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/SliderScreen'));
    },
    name: 'Slider',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/PressableScreen'));
    },
    name: 'Pressable',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/PickerScreen'));
    },
    name: 'Picker',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/CheckboxScreen'));
    },
    name: 'Checkbox',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/ButtonScreen'));
    },
    name: 'Button',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/ActivityIndicatorScreen'));
    },
    name: 'ActivityIndicator',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/DateTimePickerScreen'));
    },
    name: 'DateTimePicker',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/GL/GLScreen'));
    },
    name: 'GL',
    options: { title: 'Examples of GL use' },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/GestureHandlerPinchScreen'));
    },
    name: 'GestureHandlerPinch',
    options: { title: 'Pinch and Rotate' },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/GestureHandlerListScreen'));
    },
    name: 'GestureHandlerList',
    options: { title: 'Gesture Handler List' },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/GestureHandlerSwipeableScreen'));
    },
    name: 'GestureHandlerSwipeable',
    options: { title: 'Swipeable Rows' },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/HTMLElementsScreen'));
    },
    name: 'HTML',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/Image/ImageScreen'));
    },
    name: 'Image',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/Reanimated/ReanimatedScreen'));
    },
    name: 'Reanimated',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/SegmentedControlScreen'));
    },
    name: 'SegmentedControl',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/Skia/SkiaScreen'));
    },
    name: 'Skia',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/SVG/SVGScreen'));
    },
    name: 'SVG',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/LinearGradientScreen'));
    },
    name: 'LinearGradient',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/LottieScreen'));
    },
    name: 'Lottie',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/MapsScreen'));
    },
    name: 'Maps',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/ExpoMaps/MapsScreen'));
    },
    name: 'ExpoMaps',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/Audio/AV/VideoScreen'));
    },
    name: 'Video (expo-av)',
    route: 'video-expo-av',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/Video/VideoScreen'));
    },
    name: 'Video (expo-video)',
    route: 'video-expo-video',
    e2e: true,
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/UI/UIScreen'));
    },
    name: 'Expo UI',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/Screens'));
    },
    name: 'Screens',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/SymbolImageScreen'));
    },
    name: 'Symbols',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/WebViewScreen'));
    },
    name: 'WebView',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/PagerViewScreen'));
    },
    name: 'PagerView',
    options: { gesturesEnabled: false, title: 'PagerView Example' },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/FlashListScreen'));
    },
    name: 'FlashList',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/KeyboardControllerScreen'));
    },
    name: 'KeyboardController',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/ClipboardPasteButtonScreen'));
    },
    name: 'ClipboardPasteButton',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/LivePhotoScreen'));
    },
    name: 'LivePhoto',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/MeshGradientScreen'));
    },
    name: 'MeshGradient',
  },
].filter(routeFilterForE2e);

export const Screens: ScreenConfig[] = [
  ...ScreensList,

  ...GLScreens,
  ...CameraScreens,
  ...ImageScreens,
  ...VideoScreens,
  ...UIScreens,
  ...SVGScreens,
  ...MapsScreens,
].filter(routeFilterForE2e);

export const screenApiItems: ScreenApiItem[] = ScreensList.map(({ name, route }) => ({
  name,
  route: '/components/' + (route ?? name.toLowerCase()),
  isAvailable: true,
}));

function ExpoComponentsStackNavigator(props: { navigation: BottomTabNavigationProp<any> }) {
  const { theme } = useTheme();
  return (
    <Stack.Navigator {...props} {...getStackNavWithConfig(props.navigation, theme)}>
      <Stack.Screen
        name="ExpoComponents"
        options={{
          title: Layout.isSmallDevice ? 'Expo SDK Components' : 'Components in Expo SDK',
        }}>
        {() => <ExpoComponents apis={screenApiItems} />}
      </Stack.Screen>
      {Screens.map(({ name, getComponent, options }) => (
        <Stack.Screen name={name} key={name} getComponent={getComponent} options={options ?? {}} />
      ))}
    </Stack.Navigator>
  );
}

ExpoComponentsStackNavigator.navigationOptions = {
  title: 'Components',
  tabBarLabel: 'Components',
  tabBarIcon: ({ focused }: { focused: boolean }) => {
    return <TabIcon name="react" focused={focused} />;
  },
  tabBarBackground: () => <TabBackground />,
};

export default ExpoComponentsStackNavigator;
