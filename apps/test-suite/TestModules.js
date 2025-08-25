'use strict';

import Constants from 'expo-constants';
import { Platform } from 'expo-modules-core';

import ExponentTest from './ExponentTest';
import { isDeviceFarm } from './utils/Environment';

function browserSupportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return (
      !!window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

function optionalRequire(requirer) {
  try {
    return requirer();
  } catch {
    // eslint-disable-next-line
    return;
  }
}

// Both Location and TaskManager test suites define tasks in TaskManager.
// Since tasks can only be defined during initialization phase (not as a result
// of calling some function when the application is running, but rather in global scope),
// we need to trigger code execution of these modules here (not in `getTestModules`
// which is called in one of the components).
const LocationTestScreen = optionalRequire(() => require('./tests/Location'));
const TaskManagerTestScreen = optionalRequire(() => require('./tests/TaskManager'));
// I have a hunch that optionalRequire doesn't work when *not* in global scope
// since I had to move Camera screen import here too to get rid of an error
// caused by missing native module.
const CameraTestScreen = optionalRequire(() => require('./tests/Camera'));

// List of all modules for tests. Each file path must be statically present for
// the packager to pick them all up.
export function getTestModules() {
  const modules = [
    // Sanity
    require('./tests/Basic'),
  ];

  // Expo core modules should run everywhere
  modules.push(
    require('./tests/Asset'),
    require('./tests/Constants'),
    require('./tests/FileSystem-legacy'),
    require('./tests/Font'),
    require('./tests/ImagePicker'),
    require('./tests/ModulesCore'),
    optionalRequire(() => require('./tests/Image'))
  );

  // Universally tested APIs
  modules.push(
    require('./tests/EASClient'),
    require('./tests/Crypto'),
    require('./tests/KeepAwake'),
    require('./tests/Blur'),
    require('./tests/LinearGradient'),
    require('./tests/HTML'),
    require('./tests/FirebaseJSSDKCompat'),
    require('./tests/FirebaseJSSDK'),
    require('./tests/ImageManipulator'),
    require('./tests/Clipboard'),
    require('./tests/Fetch'),
    require('./tests/SQLite')
  );

  if (['android', 'ios'].includes(Platform.OS)) {
    modules.push(require('./tests/Blob'));
    modules.push(require('./tests/FileSystem'));
    modules.push(require('./tests/CalendarNext'));
  }

  if (Platform.OS === 'android') {
    modules.push(require('./tests/Hermes'));
  }

  if (__DEV__) {
    modules.push(require('./tests/DevToolsPluginClient'));
  }

  if (Platform.OS === 'web') {
    modules.push(
      require('./tests/Contacts'),
      // require('./tests/SVG'),
      require('./tests/Localization'),
      require('./tests/Recording'),
      optionalRequire(() => require('./tests/Notifications')),
      LocationTestScreen
    );

    if (browserSupportsWebGL()) {
      modules.push(optionalRequire(() => require('./tests/GLView')));
    }

    if (ExponentTest && !ExponentTest.isInCI) {
      // modules.push(optionalRequire(() => require('./tests/Speech')));
    }
    return modules.filter(Boolean);
  }

  modules.push(
    optionalRequire(() => require('./tests/Application')),
    optionalRequire(() => require('./tests/AuthSession')),
    optionalRequire(() => require('./tests/Device')),
    optionalRequire(() => require('./tests/GLView')),
    optionalRequire(() => require('./tests/Haptics')),
    optionalRequire(() => require('./tests/Localization')),
    optionalRequire(() => require('./tests/Network')),
    optionalRequire(() => require('./tests/SecureStore')),
    optionalRequire(() => require('./tests/Speech')),
    optionalRequire(() => require('./tests/Recording')),
    optionalRequire(() => require('./tests/ScreenOrientation')),
    optionalRequire(() => require('./tests/Notifications')),
    optionalRequire(() => require('./tests/NavigationBar')),
    optionalRequire(() => require('./tests/SystemUI'))
  );

  if (!isDeviceFarm()) {
    // Popup to request device's location which uses Google's location service
    modules.push(LocationTestScreen);
    // Fails to redirect because of malformed URL in published version with release channel parameter
    modules.push(optionalRequire(() => require('./tests/Linking')));
    // Has uncontrolled view controllers
    modules.push(require('./tests/SMS'));
    // Requires permission
    modules.push(optionalRequire(() => require('./tests/Contacts')));
    modules.push(optionalRequire(() => require('./tests/Calendar')));
    modules.push(optionalRequire(() => require('./tests/CalendarReminders')));
    modules.push(optionalRequire(() => require('./tests/MediaLibrary')));

    modules.push(optionalRequire(() => require('./tests/Battery')));
    if (Constants.isDevice) {
      modules.push(optionalRequire(() => require('./tests/Brightness')));
    }
    // Crashes app when mounting component
    modules.push(optionalRequire(() => require('./tests/Video')));
    // "sdkUnversionedTestSuite failed: java.lang.NullPointerException: Attempt to invoke interface method
    // 'java.util.Map expo.modules.interfaces.taskManager.TaskInterface.getOptions()' on a null object reference"
    modules.push(TaskManagerTestScreen);
    // Audio tests are flaky in CI due to asynchronous fetching of resources
    modules.push(optionalRequire(() => require('./tests/Audio')));

    // The Camera tests are flaky on iOS, i.e. they fail randomly
    if (Constants.isDevice) {
      modules.push(CameraTestScreen);
    }
  }
  if (Constants.isDevice) {
    modules.push(optionalRequire(() => require('./tests/Cellular')));
  }
  return modules
    .filter(Boolean)
    .sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));
}
