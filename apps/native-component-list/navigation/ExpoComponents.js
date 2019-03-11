import { Platform } from 'react-native';
import AdMob from '../screens/AdMobScreen';
import BarCodeScanner from '../screens/BarCodeScannerScreen';
import Video from '../screens/AV/VideoScreen';
import Gif from '../screens/GifScreen';
import LinearGradient from '../screens/LinearGradientScreen';

import GestureHandlerList from '../screens/GestureHandlerListScreen';
import GestureHandlerPinch from '../screens/GestureHandlerPinchScreen';
import GestureHandlerSwipeable from '../screens/GestureHandlerSwipeableScreen';
import Maps from '../screens/MapsScreen';
function optionalRequire(requirer) {
  try {
    return requirer().default;
  } catch (e) {
    return null;
  }
}

const ScreensScreens = optionalRequire(() => require('../screens/Screens'));
const BlurView = optionalRequire(() => require('../screens/BlurViewScreen'));
const Camera = optionalRequire(() => require('../screens/Camera/CameraScreen'));
const FacebookAds = optionalRequire(() => require('../screens/FacebookAdsScreen'));
const GL = optionalRequire(() => require('../screens/GL/GLScreen'));
const GLScreens = optionalRequire(() => require('../screens/GL/GLScreens'));
const Lottie = optionalRequire(() => require('../screens/LottieScreen'));
const ImagePreview = optionalRequire(() => require('../screens/Reanimated/ImagePreviewScreen'));
const SVGExample = optionalRequire(() => require('../screens/SVG/SVGExampleScreen'));
const SVG = optionalRequire(() => require('../screens/SVG/SVGScreen'));
const disabledOnWeb = (module, predicate = () => false) => {
  if (Platform.OS === 'web' && !predicate()) {
    return undefined;
  }
  return module;
};

const ShimView = () => null;
//
// const AdMob = ShimView;
// const BarCodeScanner = ShimView;
// const GestureHandlerPinch = ShimView;
// const GestureHandlerList = ShimView;
// const GestureHandlerSwipeable = ShimView;
// const ImagePreview = ShimView;
// const FacebookAds = ShimView;
// const Lottie = ShimView;
// const Maps = ShimView;
// const ScreensScreens = ShimView;

const optionalScreens = {
  AdMob: disabledOnWeb(AdMob),
  BarCodeScanner: disabledOnWeb(BarCodeScanner),
  BlurView,
  Camera,
  GL: disabledOnWeb(ShimView),
  // ...GLScreens,
  GestureHandlerPinch: disabledOnWeb(GestureHandlerPinch),
  GestureHandlerList: disabledOnWeb(GestureHandlerList),
  GestureHandlerSwipeable: disabledOnWeb(GestureHandlerSwipeable),
  ImagePreview: disabledOnWeb(ImagePreview),
  Gif,
  FacebookAds: disabledOnWeb(FacebookAds),
  SVG,
  SVGExample,
  LinearGradient,
  Lottie: disabledOnWeb(Lottie),
  Maps: disabledOnWeb(Maps),
  Video,
  Screens: disabledOnWeb(ScreensScreens),
};

export const Screens = Object.keys(optionalScreens).reduce((acc, key) => {
  if (optionalScreens[key]) {
    acc[key] = optionalScreens[key];
  }
  return acc;
}, {});
