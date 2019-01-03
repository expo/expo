import AdMob from '../screens/AdMobScreen';
import BarCodeScanner from '../screens/BarCodeScannerScreen';
import BlurView from '../screens/BlurViewScreen';
import Camera from '../screens/Camera/CameraScreen';
import ExpoComponents from '../screens/ExpoComponentsScreen';
import FacebookAds from '../screens/FacebookAdsScreen';
import GestureHandlerList from '../screens/GestureHandlerListScreen';
import GestureHandlerPinch from '../screens/GestureHandlerPinchScreen';
import GestureHandlerSwipeable from '../screens/GestureHandlerSwipeableScreen';
import Gif from '../screens/GifScreen';
import GL from '../screens/GL/GLScreen';
import GLScreens from '../screens/GL/GLScreens';
import LinearGradient from '../screens/LinearGradientScreen';
import Lottie from '../screens/LottieScreen';
import Maps from '../screens/MapsScreen';
import ImagePreview from '../screens/Reanimated/ImagePreviewScreen';
import Screens from '../screens/Screens';
import SVGExample from '../screens/SVG/SVGExampleScreen';
import SVG from '../screens/SVG/SVGScreen';
import Video from '../screens/VideoScreen';
import createStackNavigator from './createStackNavigator';
import StackConfig from './StackConfig';

const ExpoComponentsStackNavigator = createStackNavigator(
  {
    ExpoComponents,
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
    Screens,
  },
  StackConfig
);

export default ExpoComponentsStackNavigator;
