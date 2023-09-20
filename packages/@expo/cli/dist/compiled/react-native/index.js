'use strict';
var invariant = require('invariant');
var warnOnce = require('./Libraries/Utilities/warnOnce');
module.exports = {
  get AccessibilityInfo() {
    return require('./Libraries/Components/AccessibilityInfo/AccessibilityInfo').default;
  },
  get ActivityIndicator() {
    return require('./Libraries/Components/ActivityIndicator/ActivityIndicator').default;
  },
  get Button() {
    return require('./Libraries/Components/Button');
  },
  get DrawerLayoutAndroid() {
    return require('./Libraries/Components/DrawerAndroid/DrawerLayoutAndroid');
  },
  get FlatList() {
    return require('./Libraries/Lists/FlatList');
  },
  get Image() {
    return require('./Libraries/Image/Image');
  },
  get ImageBackground() {
    return require('./Libraries/Image/ImageBackground');
  },
  get InputAccessoryView() {
    return require('./Libraries/Components/TextInput/InputAccessoryView');
  },
  get KeyboardAvoidingView() {
    return require('./Libraries/Components/Keyboard/KeyboardAvoidingView').default;
  },
  get Modal() {
    return require('./Libraries/Modal/Modal');
  },
  get Pressable() {
    return require('./Libraries/Components/Pressable/Pressable').default;
  },
  get ProgressBarAndroid() {
    warnOnce('progress-bar-android-moved', 'ProgressBarAndroid has been extracted from react-native core and will be removed in a future release. ' + "It can now be installed and imported from '@react-native-community/progress-bar-android' instead of 'react-native'. " + 'See https://github.com/react-native-progress-view/progress-bar-android');
    return require('./Libraries/Components/ProgressBarAndroid/ProgressBarAndroid');
  },
  get RefreshControl() {
    return require('./Libraries/Components/RefreshControl/RefreshControl');
  },
  get SafeAreaView() {
    return require('./Libraries/Components/SafeAreaView/SafeAreaView').default;
  },
  get ScrollView() {
    return require('./Libraries/Components/ScrollView/ScrollView');
  },
  get SectionList() {
    return require('./Libraries/Lists/SectionList').default;
  },
  get StatusBar() {
    return require('./Libraries/Components/StatusBar/StatusBar');
  },
  get Switch() {
    return require('./Libraries/Components/Switch/Switch').default;
  },
  get Text() {
    return require('./Libraries/Text/Text');
  },
  get TextInput() {
    return require('./Libraries/Components/TextInput/TextInput');
  },
  get Touchable() {
    return require('./Libraries/Components/Touchable/Touchable');
  },
  get TouchableHighlight() {
    return require('./Libraries/Components/Touchable/TouchableHighlight');
  },
  get TouchableNativeFeedback() {
    return require('./Libraries/Components/Touchable/TouchableNativeFeedback');
  },
  get TouchableOpacity() {
    return require('./Libraries/Components/Touchable/TouchableOpacity');
  },
  get TouchableWithoutFeedback() {
    return require('./Libraries/Components/Touchable/TouchableWithoutFeedback');
  },
  get View() {
    return require('./Libraries/Components/View/View');
  },
  get VirtualizedList() {
    return require('./Libraries/Lists/VirtualizedList');
  },
  get VirtualizedSectionList() {
    return require('./Libraries/Lists/VirtualizedSectionList');
  },
  get ActionSheetIOS() {
    return require('./Libraries/ActionSheetIOS/ActionSheetIOS');
  },
  get Alert() {
    return require('./Libraries/Alert/Alert');
  },
  get Animated() {
    return require('./Libraries/Animated/Animated').default;
  },
  get Appearance() {
    return require('./Libraries/Utilities/Appearance');
  },
  get AppRegistry() {
    return require('./Libraries/ReactNative/AppRegistry');
  },
  get AppState() {
    return require('./Libraries/AppState/AppState');
  },
  get BackHandler() {
    return require('./Libraries/Utilities/BackHandler');
  },
  get Clipboard() {
    warnOnce('clipboard-moved', 'Clipboard has been extracted from react-native core and will be removed in a future release. ' + "It can now be installed and imported from '@react-native-clipboard/clipboard' instead of 'react-native'. " + 'See https://github.com/react-native-clipboard/clipboard');
    return require('./Libraries/Components/Clipboard/Clipboard');
  },
  get DeviceInfo() {
    return require('./Libraries/Utilities/DeviceInfo');
  },
  get DevSettings() {
    return require('./Libraries/Utilities/DevSettings');
  },
  get Dimensions() {
    return require('./Libraries/Utilities/Dimensions').default;
  },
  get Easing() {
    return require('./Libraries/Animated/Easing').default;
  },
  get findNodeHandle() {
    return require('./Libraries/ReactNative/RendererProxy').findNodeHandle;
  },
  get I18nManager() {
    return require('./Libraries/ReactNative/I18nManager');
  },
  get InteractionManager() {
    return require('./Libraries/Interaction/InteractionManager');
  },
  get Keyboard() {
    return require('./Libraries/Components/Keyboard/Keyboard');
  },
  get LayoutAnimation() {
    return require('./Libraries/LayoutAnimation/LayoutAnimation');
  },
  get Linking() {
    return require('./Libraries/Linking/Linking');
  },
  get LogBox() {
    return require('./Libraries/LogBox/LogBox').default;
  },
  get NativeDialogManagerAndroid() {
    return require('./Libraries/NativeModules/specs/NativeDialogManagerAndroid').default;
  },
  get NativeEventEmitter() {
    return require('./Libraries/EventEmitter/NativeEventEmitter').default;
  },
  get Networking() {
    return require('./Libraries/Network/RCTNetworking').default;
  },
  get PanResponder() {
    return require('./Libraries/Interaction/PanResponder').default;
  },
  get PermissionsAndroid() {
    return require('./Libraries/PermissionsAndroid/PermissionsAndroid');
  },
  get PixelRatio() {
    return require('./Libraries/Utilities/PixelRatio').default;
  },
  get PushNotificationIOS() {
    warnOnce('pushNotificationIOS-moved', 'PushNotificationIOS has been extracted from react-native core and will be removed in a future release. ' + "It can now be installed and imported from '@react-native-community/push-notification-ios' instead of 'react-native'. " + 'See https://github.com/react-native-push-notification-ios/push-notification-ios');
    return require('./Libraries/PushNotificationIOS/PushNotificationIOS');
  },
  get Settings() {
    return require('./Libraries/Settings/Settings');
  },
  get Share() {
    return require('./Libraries/Share/Share');
  },
  get StyleSheet() {
    return require('./Libraries/StyleSheet/StyleSheet');
  },
  get Systrace() {
    return require('./Libraries/Performance/Systrace');
  },
  get ToastAndroid() {
    return require('./Libraries/Components/ToastAndroid/ToastAndroid');
  },
  get TurboModuleRegistry() {
    return require('./Libraries/TurboModule/TurboModuleRegistry');
  },
  get UIManager() {
    return require('./Libraries/ReactNative/UIManager');
  },
  get unstable_batchedUpdates() {
    return require('./Libraries/ReactNative/RendererProxy').unstable_batchedUpdates;
  },
  get useAnimatedValue() {
    return require('./Libraries/Animated/useAnimatedValue').default;
  },
  get useColorScheme() {
    return require('./Libraries/Utilities/useColorScheme').default;
  },
  get useWindowDimensions() {
    return require('./Libraries/Utilities/useWindowDimensions').default;
  },
  get UTFSequence() {
    return require('./Libraries/UTFSequence').default;
  },
  get Vibration() {
    return require('./Libraries/Vibration/Vibration');
  },
  get YellowBox() {
    return require('./Libraries/YellowBox/YellowBoxDeprecated');
  },
  get DeviceEventEmitter() {
    return require('./Libraries/EventEmitter/RCTDeviceEventEmitter').default;
  },
  get DynamicColorIOS() {
    return require('./Libraries/StyleSheet/PlatformColorValueTypesIOS').DynamicColorIOS;
  },
  get NativeAppEventEmitter() {
    return require('./Libraries/EventEmitter/RCTNativeAppEventEmitter');
  },
  get NativeModules() {
    return require('./Libraries/BatchedBridge/NativeModules');
  },
  get Platform() {
    return require('./Libraries/Utilities/Platform');
  },
  get PlatformColor() {
    return require('./Libraries/StyleSheet/PlatformColorValueTypes').PlatformColor;
  },
  get processColor() {
    return require('./Libraries/StyleSheet/processColor').default;
  },
  get requireNativeComponent() {
    return require('./Libraries/ReactNative/requireNativeComponent').default;
  },
  get RootTagContext() {
    return require('./Libraries/ReactNative/RootTag').RootTagContext;
  },
  get unstable_enableLogBox() {
    return function () {
      return console.warn('LogBox is enabled by default so there is no need to call unstable_enableLogBox() anymore. This is a no op and will be removed in the next version.');
    };
  },
  get ColorPropType() {
    console.error('ColorPropType will be removed from React Native, along with all ' + 'other PropTypes. We recommend that you migrate away from PropTypes ' + 'and switch to a type system like TypeScript. If you need to ' + 'continue using ColorPropType, migrate to the ' + "'deprecated-react-native-prop-types' package.");
    return require('deprecated-react-native-prop-types').ColorPropType;
  },
  get EdgeInsetsPropType() {
    console.error('EdgeInsetsPropType will be removed from React Native, along with all ' + 'other PropTypes. We recommend that you migrate away from PropTypes ' + 'and switch to a type system like TypeScript. If you need to ' + 'continue using EdgeInsetsPropType, migrate to the ' + "'deprecated-react-native-prop-types' package.");
    return require('deprecated-react-native-prop-types').EdgeInsetsPropType;
  },
  get PointPropType() {
    console.error('PointPropType will be removed from React Native, along with all ' + 'other PropTypes. We recommend that you migrate away from PropTypes ' + 'and switch to a type system like TypeScript. If you need to ' + 'continue using PointPropType, migrate to the ' + "'deprecated-react-native-prop-types' package.");
    return require('deprecated-react-native-prop-types').PointPropType;
  },
  get ViewPropTypes() {
    console.error('ViewPropTypes will be removed from React Native, along with all ' + 'other PropTypes. We recommend that you migrate away from PropTypes ' + 'and switch to a type system like TypeScript. If you need to ' + 'continue using ViewPropTypes, migrate to the ' + "'deprecated-react-native-prop-types' package.");
    return require('deprecated-react-native-prop-types').ViewPropTypes;
  }
};
if (__DEV__) {
  Object.defineProperty(module.exports, 'ART', {
    configurable: true,
    get: function get() {
      invariant(false, 'ART has been removed from React Native. ' + "It can now be installed and imported from '@react-native-community/art' instead of 'react-native'. " + 'See https://github.com/react-native-art/art');
    }
  });
  Object.defineProperty(module.exports, 'ListView', {
    configurable: true,
    get: function get() {
      invariant(false, 'ListView has been removed from React Native. ' + 'See https://fb.me/nolistview for more information or use ' + '`deprecated-react-native-listview`.');
    }
  });
  Object.defineProperty(module.exports, 'SwipeableListView', {
    configurable: true,
    get: function get() {
      invariant(false, 'SwipeableListView has been removed from React Native. ' + 'See https://fb.me/nolistview for more information or use ' + '`deprecated-react-native-swipeable-listview`.');
    }
  });
  Object.defineProperty(module.exports, 'WebView', {
    configurable: true,
    get: function get() {
      invariant(false, 'WebView has been removed from React Native. ' + "It can now be installed and imported from 'react-native-webview' instead of 'react-native'. " + 'See https://github.com/react-native-webview/react-native-webview');
    }
  });
  Object.defineProperty(module.exports, 'NetInfo', {
    configurable: true,
    get: function get() {
      invariant(false, 'NetInfo has been removed from React Native. ' + "It can now be installed and imported from '@react-native-community/netinfo' instead of 'react-native'. " + 'See https://github.com/react-native-netinfo/react-native-netinfo');
    }
  });
  Object.defineProperty(module.exports, 'CameraRoll', {
    configurable: true,
    get: function get() {
      invariant(false, 'CameraRoll has been removed from React Native. ' + "It can now be installed and imported from '@react-native-community/cameraroll' instead of 'react-native'. " + 'See https://github.com/react-native-cameraroll/react-native-cameraroll');
    }
  });
  Object.defineProperty(module.exports, 'ImageStore', {
    configurable: true,
    get: function get() {
      invariant(false, 'ImageStore has been removed from React Native. ' + 'To get a base64-encoded string from a local image use either of the following third-party libraries:' + "* expo-file-system: `readAsStringAsync(filepath, 'base64')`" + "* react-native-fs: `readFile(filepath, 'base64')`");
    }
  });
  Object.defineProperty(module.exports, 'ImageEditor', {
    configurable: true,
    get: function get() {
      invariant(false, 'ImageEditor has been removed from React Native. ' + "It can now be installed and imported from '@react-native-community/image-editor' instead of 'react-native'. " + 'See https://github.com/callstack/react-native-image-editor');
    }
  });
  Object.defineProperty(module.exports, 'TimePickerAndroid', {
    configurable: true,
    get: function get() {
      invariant(false, 'TimePickerAndroid has been removed from React Native. ' + "It can now be installed and imported from '@react-native-community/datetimepicker' instead of 'react-native'. " + 'See https://github.com/react-native-datetimepicker/datetimepicker');
    }
  });
  Object.defineProperty(module.exports, 'ToolbarAndroid', {
    configurable: true,
    get: function get() {
      invariant(false, 'ToolbarAndroid has been removed from React Native. ' + "It can now be installed and imported from '@react-native-community/toolbar-android' instead of 'react-native'. " + 'See https://github.com/react-native-toolbar-android/toolbar-android');
    }
  });
  Object.defineProperty(module.exports, 'ViewPagerAndroid', {
    configurable: true,
    get: function get() {
      invariant(false, 'ViewPagerAndroid has been removed from React Native. ' + "It can now be installed and imported from 'react-native-pager-view' instead of 'react-native'. " + 'See https://github.com/callstack/react-native-pager-view');
    }
  });
  Object.defineProperty(module.exports, 'CheckBox', {
    configurable: true,
    get: function get() {
      invariant(false, 'CheckBox has been removed from React Native. ' + "It can now be installed and imported from '@react-native-community/checkbox' instead of 'react-native'. " + 'See https://github.com/react-native-checkbox/react-native-checkbox');
    }
  });
  Object.defineProperty(module.exports, 'SegmentedControlIOS', {
    configurable: true,
    get: function get() {
      invariant(false, 'SegmentedControlIOS has been removed from React Native. ' + "It can now be installed and imported from '@react-native-community/segmented-checkbox' instead of 'react-native'." + 'See https://github.com/react-native-segmented-control/segmented-control');
    }
  });
  Object.defineProperty(module.exports, 'StatusBarIOS', {
    configurable: true,
    get: function get() {
      invariant(false, 'StatusBarIOS has been removed from React Native. ' + 'Has been merged with StatusBar. ' + 'See https://reactnative.dev/docs/statusbar');
    }
  });
  Object.defineProperty(module.exports, 'PickerIOS', {
    configurable: true,
    get: function get() {
      invariant(false, 'PickerIOS has been removed from React Native. ' + "It can now be installed and imported from '@react-native-picker/picker' instead of 'react-native'. " + 'See https://github.com/react-native-picker/picker');
    }
  });
  Object.defineProperty(module.exports, 'Picker', {
    configurable: true,
    get: function get() {
      invariant(false, 'Picker has been removed from React Native. ' + "It can now be installed and imported from '@react-native-picker/picker' instead of 'react-native'. " + 'See https://github.com/react-native-picker/picker');
    }
  });
  Object.defineProperty(module.exports, 'DatePickerAndroid', {
    configurable: true,
    get: function get() {
      invariant(false, 'DatePickerAndroid has been removed from React Native. ' + "It can now be installed and imported from '@react-native-community/datetimepicker' instead of 'react-native'. " + 'See https://github.com/react-native-datetimepicker/datetimepicker');
    }
  });
  Object.defineProperty(module.exports, 'MaskedViewIOS', {
    configurable: true,
    get: function get() {
      invariant(false, 'MaskedViewIOS has been removed from React Native. ' + "It can now be installed and imported from '@react-native-community/react-native-masked-view' instead of 'react-native'. " + 'See https://github.com/react-native-masked-view/masked-view');
    }
  });
  Object.defineProperty(module.exports, 'AsyncStorage', {
    configurable: true,
    get: function get() {
      invariant(false, 'AsyncStorage has been removed from react-native core. ' + "It can now be installed and imported from '@react-native-async-storage/async-storage' instead of 'react-native'. " + 'See https://github.com/react-native-async-storage/async-storage');
    }
  });
  Object.defineProperty(module.exports, 'ImagePickerIOS', {
    configurable: true,
    get: function get() {
      invariant(false, 'ImagePickerIOS has been removed from React Native. ' + "Please upgrade to use either '@react-native-community/react-native-image-picker' or 'expo-image-picker'. " + "If you cannot upgrade to a different library, please install the deprecated '@react-native-community/image-picker-ios' package. " + 'See https://github.com/rnc-archive/react-native-image-picker-ios');
    }
  });
  Object.defineProperty(module.exports, 'ProgressViewIOS', {
    configurable: true,
    get: function get() {
      invariant(false, 'ProgressViewIOS has been removed from react-native core. ' + "It can now be installed and imported from '@react-native-community/progress-view' instead of 'react-native'. " + 'See https://github.com/react-native-progress-view/progress-view');
    }
  });
  Object.defineProperty(module.exports, 'DatePickerIOS', {
    configurable: true,
    get: function get() {
      invariant(false, 'DatePickerIOS has been removed from react-native core. ' + "It can now be installed and imported from '@react-native-community/datetimepicker' instead of 'react-native'. " + 'See https://github.com/react-native-datetimepicker/datetimepicker');
    }
  });
  Object.defineProperty(module.exports, 'Slider', {
    configurable: true,
    get: function get() {
      invariant(false, 'Slider has been removed from react-native core. ' + "It can now be installed and imported from '@react-native-community/slider' instead of 'react-native'. " + 'See https://github.com/callstack/react-native-slider');
    }
  });
}
//# sourceMappingURL=index.js.map