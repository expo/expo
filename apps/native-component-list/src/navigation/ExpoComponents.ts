import AdMob from '../screens/AdMobScreen';
import BarCodeScanner from '../screens/BarCodeScannerScreen';

import GestureHandlerList from '../screens/GestureHandlerListScreen';
import GestureHandlerPinch from '../screens/GestureHandlerPinchScreen';
import GestureHandlerSwipeable from '../screens/GestureHandlerSwipeableScreen';
import Gif from '../screens/GifScreen';
import LinearGradient from '../screens/LinearGradientScreen';
import Maps from '../screens/MapsScreen';
import Video from '../screens/AV/VideoScreen';
import WebView from '../screens/WebViewScreen';

function optionalRequire(requirer: () => { default: React.ComponentType }) {
  try {
    return requirer().default;
  } catch (e) {
    return;
  }
}

const ScreensScreens = optionalRequire(() => require('../screens/Screens'));
const BlurView = optionalRequire(() => require('../screens/BlurViewScreen'));
const Camera = optionalRequire(() => require('../screens/Camera/CameraScreen'));
const FacebookAds = optionalRequire(() =>
  require('../screens/FacebookAdsScreen')
);
const GL = optionalRequire(() => require('../screens/GL/GLScreen'));
const GLScreens = optionalRequire(
  () => require('../screens/GL/GLScreens')
) as unknown as { [key: string]: React.ComponentType };
const Lottie = optionalRequire(() => require('../screens/LottieScreen'));
const ReanimatedImagePreview = optionalRequire(() =>
  require('../screens/Reanimated/ReanimatedImagePreviewScreen')
);
const ReanimatedProgress = optionalRequire(() =>
  require('../screens/Reanimated/ReanimatedProgressScreen')
);
const SVGExample = optionalRequire(() => require('../screens/SVG/SVGExampleScreen'));
const SVG = optionalRequire(() => require('../screens/SVG/SVGScreen'));

const optionalScreens: { [key: string]: React.ComponentType | undefined } = {
  AdMob,
  BarCodeScanner,
  BlurView,
  Camera,
  GL,
  ...GLScreens,
  GestureHandlerPinch,
  GestureHandlerList,
  GestureHandlerSwipeable,
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
};

interface ScreensObjectType {
  [key: string]: React.ComponentType;
}

export const Screens = Object.entries(optionalScreens)
  .reduce<ScreensObjectType>((acc, [key, screen]) => {
    if (screen) {
      acc[key] = screen;
    }
    return acc;
  }, {});
