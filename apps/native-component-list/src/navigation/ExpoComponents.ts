function optionalRequire(requirer: () => { default: React.ComponentType }) {
  try {
    return requirer().default;
  } catch (e) {
    return null;
  }
}

const AdMob = optionalRequire(() => require('../screens/AdMobScreen'));

const BarCodeScanner = optionalRequire(() => require('../screens/BarCodeScannerScreen'));
const BasicMaskScreen = optionalRequire(() => require('../screens/BasicMaskScreen'));
const BlurView = optionalRequire(() => require('../screens/BlurViewScreen'));
const Camera = optionalRequire(() => require('../screens/Camera/CameraScreen'));
const DateTimePicker = optionalRequire(() => require('../screens/DateTimePickerScreen'));
const GestureHandlerList = optionalRequire(() => require('../screens/GestureHandlerListScreen'));
const GestureHandlerPinch = optionalRequire(() => require('../screens/GestureHandlerPinchScreen'));
const GestureHandlerSwipeable = optionalRequire(() =>
  require('../screens/GestureHandlerSwipeableScreen')
);
const Gif = optionalRequire(() => require('../screens/GifScreen'));
const LinearGradient = optionalRequire(() => require('../screens/LinearGradientScreen'));
const Maps = optionalRequire(() => require('../screens/MapsScreen'));
const Video = optionalRequire(() => require('../screens/AV/VideoScreen'));
const WebView = optionalRequire(() => require('../screens/WebViewScreen'));
const ScreensScreens = optionalRequire(() => require('../screens/Screens'));
const FacebookAds = optionalRequire(() => require('../screens/FacebookAdsScreen'));
const GL = optionalRequire(() => require('../screens/GL/GLScreen'));
const GLScreens = (optionalRequire(() => require('../screens/GL/GLScreens')) as unknown) as {
  [key: string]: React.ComponentType;
};
const Lottie = optionalRequire(() => require('../screens/LottieScreen'));
const ReanimatedImagePreview = optionalRequire(() =>
  require('../screens/Reanimated/ReanimatedImagePreviewScreen')
);
const ReanimatedProgress = optionalRequire(() =>
  require('../screens/Reanimated/ReanimatedProgressScreen')
);
const SVGExample = optionalRequire(() => require('../screens/SVG/SVGExampleScreen'));
const SVG = optionalRequire(() => require('../screens/SVG/SVGScreen'));
const SharedElement = optionalRequire(() => require('../screens/SharedElementScreen'));
const ViewPager = optionalRequire(() => require('../screens/ViewPagerScreen'));
const HTML = optionalRequire(() => require('../screens/HTMLElementsScreen'));
const Image = optionalRequire(() => require('../screens/Image/ImageScreen'));
const ImageScreens = (optionalRequire(() =>
  require('../screens/Image/ImageScreens')
) as unknown) as {
  [key: string]: React.ComponentType;
};

const optionalScreens: { [key: string]: React.ComponentType | null } = {
  AdMob,
  BarCodeScanner,
  MaskedView: BasicMaskScreen,
  BlurView,
  Camera,
  DateTimePicker,
  GL,
  ...GLScreens,
  GestureHandlerPinch,
  GestureHandlerList,
  GestureHandlerSwipeable,
  HTML,
  Image,
  ...ImageScreens,
  ReanimatedImagePreview,
  ReanimatedProgress,
  Gif,
  FacebookAds,
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

export const Screens = Object.entries(optionalScreens).reduce<ScreensObjectType>(
  (acc, [key, screen]) => {
    if (screen) {
      acc[key] = screen;
    }
    return acc;
  },
  {}
);
