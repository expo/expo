function optionalRequire(requirer: () => { default: React.ComponentType }) {
  try {
    return requirer().default;
  } catch (e) {
    return null;
  }
}

const ActivityIndicator = optionalRequire(() => require('../screens/ActivityIndicatorScreen'));
const AdMob = optionalRequire(() => require('../screens/AdMobScreen'));
const BarCodeScanner = optionalRequire(() => require('../screens/BarCodeScannerScreen'));
const BasicMaskScreen = optionalRequire(() => require('../screens/BasicMaskScreen'));
const BlurView = optionalRequire(() => require('../screens/BlurViewScreen'));
const Button = optionalRequire(() => require('../screens/ButtonScreen'));
const Camera = optionalRequire(() => require('../screens/Camera/CameraScreen'));
const Checkbox = optionalRequire(() => require('../screens/CheckboxScreen'));
const DateTimePicker = optionalRequire(() => require('../screens/DateTimePickerScreen'));
const DrawerLayoutAndroid = optionalRequire(() => require('../screens/DrawerLayoutAndroidScreen'));
const FacebookAds = optionalRequire(() => require('../screens/FacebookAdsScreen'));
const GestureHandlerList = optionalRequire(() => require('../screens/GestureHandlerListScreen'));
const GestureHandlerPinch = optionalRequire(() => require('../screens/GestureHandlerPinchScreen'));
const GestureHandlerSwipeable = optionalRequire(() =>
  require('../screens/GestureHandlerSwipeableScreen')
);
const GL = optionalRequire(() => require('../screens/GL/GLScreen'));
const GLScreens = (optionalRequire(() => require('../screens/GL/GLScreens')) as unknown) as {
  [key: string]: React.ComponentType;
};
const Gif = optionalRequire(() => require('../screens/GifScreen'));
const HTML = optionalRequire(() => require('../screens/HTMLElementsScreen'));
const Image = optionalRequire(() => require('../screens/Image/ImageScreen'));
const ImageScreens = (optionalRequire(() =>
  require('../screens/Image/ImageScreens')
) as unknown) as {
  [key: string]: React.ComponentType;
};
const LinearGradient = optionalRequire(() => require('../screens/LinearGradientScreen'));
const Lottie = optionalRequire(() => require('../screens/LottieScreen'));
const Maps = optionalRequire(() => require('../screens/MapsScreen'));
const Modal = optionalRequire(() => require('../screens/ModalScreen'));
const Picker = optionalRequire(() => require('../screens/PickerScreen'));
const Pressable = optionalRequire(() => require('../screens/PressableScreen'));
const ProgressBarAndroid = optionalRequire(() => require('../screens/ProgressBarAndroidScreen'));
const ProgressViewIOS = optionalRequire(() => require('../screens/ProgressViewIOSScreen'));
const QRCode = optionalRequire(() => require('../screens/QRCodeScreen'));
const Reanimated = optionalRequire(() => require('../screens/Reanimated/ReanimatedScreen'));
const ScreensScreens = optionalRequire(() => require('../screens/Screens'));
const ScrollView = optionalRequire(() => require('../screens/ScrollViewScreen'));
const Slider = optionalRequire(() => require('../screens/SliderScreen'));
const Switch = optionalRequire(() => require('../screens/SwitchScreen'));
const TouchableBounce = optionalRequire(() => require('../screens/TouchableBounceScreen'));
const Text = optionalRequire(() => require('../screens/TextScreen'));
const TextInput = optionalRequire(() => require('../screens/TextInputScreen'));
const Touchables = optionalRequire(() => require('../screens/TouchablesScreen'));
const SegmentedControl = optionalRequire(() => require('../screens/SegmentedControlScreen'));
const SVGExample = optionalRequire(() => require('../screens/SVG/SVGExampleScreen'));
const SVG = optionalRequire(() => require('../screens/SVG/SVGScreen'));
const SharedElement = optionalRequire(() => require('../screens/SharedElementScreen'));
const ViewPager = optionalRequire(() => require('../screens/ViewPagerScreen'));
const Video = optionalRequire(() => require('../screens/AV/VideoScreen'));
const WebView = optionalRequire(() => require('../screens/WebViewScreen'));

const optionalScreens: { [key: string]: React.ComponentType | null } = {
  AdMob,
  BarCodeScanner,
  DrawerLayoutAndroid,
  Modal,
  ScrollView,
  MaskedView: BasicMaskScreen,
  BlurView,
  Camera,
  Text,
  TextInput,
  Touchables,
  ProgressViewIOS,
  ProgressBarAndroid,
  TouchableBounce,
  Switch,
  Slider,
  Pressable,
  Picker,
  Checkbox,
  Button,
  ActivityIndicator,
  QRCode,
  DateTimePicker,
  GL,
  ...Object.keys(GLScreens ?? {}).reduce((prev, screenName) => {
    const entry = GLScreens[screenName];
    // @ts-ignore
    const screen = entry.screen ?? entry;
    screen.navigationOptions = {
      title: screen.title,
    };
    screen.route = `gl/${screenName.toLowerCase()}`;
    return {
      ...prev,
      [screenName]: screen,
    };
  }, {}),
  GestureHandlerPinch,
  GestureHandlerList,
  GestureHandlerSwipeable,
  HTML,
  Image,
  ...ImageScreens,
  Reanimated,
  Gif,
  FacebookAds,
  SegmentedControl,
  SVG,
  SVGExample,
  LinearGradient,
  Lottie,
  Maps,
  Video,
  Screens: ScreensScreens,
  WebView,
  ViewPager,
  SharedElement,
};

interface ScreensObjectType {
  [key: string]: React.ComponentType;
}
type RoutesObjectType = Record<string, string>;

export const Screens = Object.entries(optionalScreens).reduce<ScreensObjectType>(
  (acc, [key, screen]) => {
    if (screen) {
      acc[key] = screen;
    }
    return acc;
  },
  {}
);

export const Routes = Object.entries(Screens).reduce<RoutesObjectType>((acc, [key, screen]) => {
  // @ts-ignore: route not available
  acc[key] = screen.route ?? key.toLowerCase();
  return acc;
}, {});
