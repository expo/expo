import AdMob from '../screens/AdMobScreen';
import BarCodeScanner from '../screens/BarCodeScannerScreen';
import BlurView from '../screens/BlurViewScreen';
import Camera from '../screens/Camera/CameraScreen';
import ExpoComponents from '../screens/ExpoComponentsScreen';
import Gif from '../screens/GifScreen';
import GL from '../screens/GL/GLScreen';
import GLScreens from '../screens/GL/GLScreens';
import LinearGradient from '../screens/LinearGradientScreen';
import Lottie from '../screens/LottieScreen';
import Maps from '../screens/MapsScreen';
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
    Gif,
    SVG,
    SVGExample,
    LinearGradient,
    Lottie,
    Maps,
    Video,
  },
  StackConfig
);

export default ExpoComponentsStackNavigator;
