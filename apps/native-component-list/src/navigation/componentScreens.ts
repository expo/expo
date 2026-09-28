import { componentScreensToListElements } from '../screens/ComponentListScreen';
import { type ScreenConfig } from '../types/ScreenConfig';
import { optionalRequire, optionalScreens } from './routeBuilder';

// Screen groups are loaded lazily so a group whose module fails to load, for example because it
// imports a native module the current platform does not have, only drops itself from the list.
const BlurScreens: ScreenConfig[] = optionalScreens(
  () => require('../screens/BlurView/BlurViewScreen').BlurScreens
);
const CameraScreens: ScreenConfig[] = optionalScreens(
  () => require('../screens/Camera/CameraScreen').CameraScreens
);
const MapsScreens: ScreenConfig[] = optionalScreens(
  () => require('../screens/ExpoMaps/MapsScreen').MapsScreens
);
const GLScreens: ScreenConfig[] = optionalScreens(
  () => require('../screens/GL/GLScreen').GLScreens
);
const ImageScreens: ScreenConfig[] = optionalScreens(
  () => require('../screens/Image/ImageScreen').ImageScreens
);
const SVGScreens: ScreenConfig[] = optionalScreens(
  () => require('../screens/SVG/SVGScreen').SVGScreens
);
const UIScreens: ScreenConfig[] = optionalScreens(
  () => require('../screens/UI/UIScreen').UIScreens
);
const UIUniversalScreens: ScreenConfig[] = optionalScreens(
  () => require('../screens/UIUniversal/UIUniversalScreen').UIUniversalScreens
);
const VideoScreens: ScreenConfig[] = optionalScreens(
  () => require('../screens/Video/VideoScreen').VideoScreens
);

export const ScreensList: ScreenConfig[] = [
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
    route: 'blur',
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
      return optionalRequire(() => require('../screens/Video/VideoScreen'));
    },
    name: 'Video (expo-video)',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/UI/UIScreen'));
    },
    name: 'Expo UI',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/UIUniversal/UIUniversalScreen'));
    },
    name: 'Expo UI (Universal)',
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
];

export const Screens: ScreenConfig[] = [
  ...ScreensList,

  ...BlurScreens,
  ...GLScreens,
  ...CameraScreens,
  ...ImageScreens,
  ...VideoScreens,
  ...UIScreens,
  ...UIUniversalScreens,
  ...SVGScreens,
  ...MapsScreens,
];

export const screenApiItems = componentScreensToListElements(ScreensList);
