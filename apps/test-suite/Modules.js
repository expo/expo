import { Platform } from 'react-native';
import { Constants } from 'expo';

function browserSupportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return (
      !!window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

// List of all modules for tests. Each file path must be statically present for
// the packager to pick them all up.
export default function getTestModules() {
  if (Platform.OS === 'web') {
    const modules = [
      require('./tests/Import1'),
      require('./tests/Crypto'),
      require('./tests/Random'),
    ];

    if (browserSupportsWebGL()) {
      modules.push(require('./tests/GLView'));
    }
    return modules;
  }

  const modules = [
    require('./tests/Basic1'),
    require('./tests/Basic2'),
    require('./tests/Import1'),
    require('./tests/Import2'),
    require('./tests/Import3'),
    require('./tests/Asset'),
    require('./tests/Audio'),
    require('./tests/Calendar'),
    require('./tests/Constants'),
    require('./tests/Contacts'),
    require('./tests/Crypto'),
    require('./tests/FileSystem'),
    require('./tests/GLView'),
    require('./tests/GoogleSignIn'),
    require('./tests/Haptics'),
    require('./tests/Localization'),
    require('./tests/Location'),
    require('./tests/Linking'),
    require('./tests/Recording'),
    require('./tests/ScreenOrientation'),
    require('./tests/SecureStore'),
    require('./tests/Segment'),
    require('./tests/Speech'),
    require('./tests/SQLite'),
    require('./tests/Random'),
    require('./tests/Payments'),
    require('./tests/AdMobInterstitial'),
    require('./tests/AdMobBanner'),
    require('./tests/AdMobPublisherBanner'),
    require('./tests/AdMobRewarded'),
    require('./tests/Video'),
    require('./tests/Permissions'),
    require('./tests/MediaLibrary'),
    require('./tests/Notifications'),
    require('./tests/FBNativeAd'),
    require('./tests/FBBannerAd'),
    require('./tests/TaskManager'),
  ];
  if (Constants.isDevice) {
    modules.push(require('./tests/Brightness'));
    modules.push(require('./tests/BarCodeScanner'));
    if (Platform.OS === 'android') {
      modules.push(require('./tests/JSC'));
      // The Camera tests are flaky on iOS, i.e. they fail randomly
      modules.push(require('./tests/Camera'));
    }
  }
  return modules;
}
