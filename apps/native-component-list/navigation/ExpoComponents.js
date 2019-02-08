import AdMob from '../screens/AdMobScreen';
import BarCodeScanner from '../screens/BarCodeScannerScreen';

import GestureHandlerList from '../screens/GestureHandlerListScreen';
import GestureHandlerPinch from '../screens/GestureHandlerPinchScreen';
import GestureHandlerSwipeable from '../screens/GestureHandlerSwipeableScreen';
import Gif from '../screens/GifScreen';
import LinearGradient from '../screens/LinearGradientScreen';
import Maps from '../screens/MapsScreen';
import ScreensScreens from '../screens/Screens';
import Video from '../screens/AV/VideoScreen';

function optionalRequire(requirer) {
  try {
    return requirer().default;
  } catch (e) {
    return null;
  }
}

const BlurView = optionalRequire(() => require('../screens/BlurViewScreen'));
const Camera = optionalRequire(() => require('../screens/Camera/CameraScreen'));
const FacebookAds = optionalRequire(() => require('../screens/FacebookAdsScreen'));
const GL = optionalRequire(() => require('../screens/GL/GLScreen'));
const GLScreens = optionalRequire(() => require('../screens/GL/GLScreens'));
const Lottie = optionalRequire(() => require('../screens/LottieScreen'));
const ImagePreview = optionalRequire(() => require('../screens/Reanimated/ImagePreviewScreen'));
const SVGExample = optionalRequire(() => require('../screens/SVG/SVGExampleScreen'));
const SVG = optionalRequire(() => require('../screens/SVG/SVGScreen'));

const optionalScreens = {
  AdMob,
  BarCodeScanner,
  BlurView,
  Camera,
  GL,
  ...GLScreens,
  GestureHandlerPinch,
  GestureHandlerList,
  GestureHandlerSwipeable,
  ImagePreview,
  Gif,
  FacebookAds,
  SVG,
  SVGExample,
  LinearGradient,
  Lottie,
  Maps,
  Video,
  Screens: ScreensScreens,
};

export const Screens = Object.keys(optionalScreens).reduce((acc, key) => {
  if (optionalScreens[key]) {
    acc[key] = optionalScreens[key];
  }
  return acc;
}, {});
