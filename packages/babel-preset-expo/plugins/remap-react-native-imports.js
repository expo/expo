/**
 * Copyright (c) Expo.
 * Copyright (c) Nicolas Gallagher.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Based on the react-native-web babel plugin which also remaps imports to their exact location.
// This plugin lets you skip over the main entry file of `react-native` and effectively bundle less code, faster.
// The drawback is that you won't see any deprecations warnings provided by the react-native re-export file.

// Importing anything that isn't listed below will effectively break the plugin and cause everything to be bundled.
// The only legitimate reason to do this, is to access the flow type `HostComponent` which is only implemented in the RN entry file.
// Importing any of the already deprecated packages will also cause everything to be bundled, but they'll throw a useful error message.
// This includes:
// ART, ListView, SwipeableListView, WebView, NetInfo, CameraRoll, ImageStore, ImageEditor, TimePickerAndroid, ToolbarAndroid, ViewPagerAndroid.

const MAPPING = {
  AccessibilityInfo: 'Libraries/Components/AccessibilityInfo/AccessibilityInfo',
  ActivityIndicator: 'Libraries/Components/ActivityIndicator/ActivityIndicator',
  Button: 'Libraries/Components/Button',
  CheckBox: 'Libraries/Components/CheckBox/CheckBox',
  DatePickerIOS: 'Libraries/Components/DatePicker/DatePickerIOS',
  DrawerLayoutAndroid: 'Libraries/Components/DrawerAndroid/DrawerLayoutAndroid',
  FlatList: 'Libraries/Lists/FlatList',
  Image: 'Libraries/Image/Image',
  ImageBackground: 'Libraries/Image/ImageBackground',
  InputAccessoryView: 'Libraries/Components/TextInput/InputAccessoryView',
  KeyboardAvoidingView: 'Libraries/Components/Keyboard/KeyboardAvoidingView',
  MaskedViewIOS: 'Libraries/Components/MaskedView/MaskedViewIOS',
  Modal: 'Libraries/Modal/Modal',
  Picker: 'Libraries/Components/Picker/Picker',
  PickerIOS: 'Libraries/Components/Picker/PickerIOS',
  Pressable: ['Libraries/Components/Pressable/Pressable', 'default'],
  ProgressBarAndroid: 'Libraries/Components/ProgressBarAndroid/ProgressBarAndroid',
  ProgressViewIOS: 'Libraries/Components/ProgressViewIOS/ProgressViewIOS',
  SafeAreaView: 'Libraries/Components/SafeAreaView/SafeAreaView',
  ScrollView: 'Libraries/Components/ScrollView/ScrollView',
  SectionList: 'Libraries/Lists/SectionList',
  SegmentedControlIOS: 'Libraries/Components/SegmentedControlIOS/SegmentedControlIOS',
  Slider: 'Libraries/Components/Slider/Slider',
  Switch: 'Libraries/Components/Switch/Switch',
  RefreshControl: 'Libraries/Components/RefreshControl/RefreshControl',
  StatusBar: 'Libraries/Components/StatusBar/StatusBar',
  Text: 'Libraries/Text/Text',
  TextInput: 'Libraries/Components/TextInput/TextInput',
  Touchable: 'Libraries/Components/Touchable/Touchable',
  TouchableHighlight: 'Libraries/Components/Touchable/TouchableHighlight',
  TouchableNativeFeedback: 'Libraries/Components/Touchable/TouchableNativeFeedback',
  TouchableOpacity: 'Libraries/Components/Touchable/TouchableOpacity',
  TouchableWithoutFeedback: 'Libraries/Components/Touchable/TouchableWithoutFeedback',
  View: 'Libraries/Components/View/View',
  VirtualizedList: 'Libraries/Lists/VirtualizedList',
  VirtualizedSectionList: 'Libraries/Lists/VirtualizedSectionList',
  ActionSheetIOS: 'Libraries/ActionSheetIOS/ActionSheetIOS',
  Alert: 'Libraries/Alert/Alert',
  Animated: 'Libraries/Animated/src/Animated',
  Appearance: 'Libraries/Utilities/Appearance',
  AppRegistry: 'Libraries/ReactNative/AppRegistry',
  AppState: 'Libraries/AppState/AppState',
  AsyncStorage: 'Libraries/Storage/AsyncStorage',
  BackHandler: 'Libraries/Utilities/BackHandler',
  Clipboard: 'Libraries/Components/Clipboard/Clipboard',
  DatePickerAndroid: 'Libraries/Components/DatePickerAndroid/DatePickerAndroid',
  DeviceInfo: 'Libraries/Utilities/DeviceInfo',
  DevSettings: 'Libraries/Utilities/DevSettings',
  Dimensions: 'Libraries/Utilities/Dimensions',
  Easing: 'Libraries/Animated/src/Easing',
  findNodeHandle: ['Libraries/Renderer/shims/ReactNative', 'findNodeHandle'],
  I18nManager: 'Libraries/ReactNative/I18nManager',
  ImagePickerIOS: 'Libraries/Image/ImagePickerIOS',
  InteractionManager: 'Libraries/Interaction/InteractionManager',
  Keyboard: 'Libraries/Components/Keyboard/Keyboard',
  LayoutAnimation: 'Libraries/LayoutAnimation/LayoutAnimation',
  Linking: 'Libraries/Linking/Linking',
  LogBox: 'Libraries/LogBox/LogBox',
  NativeDialogManagerAndroid: [
    'Libraries/NativeModules/specs/NativeDialogManagerAndroid',
    'default',
  ],
  NativeEventEmitter: 'Libraries/EventEmitter/NativeEventEmitter',
  Networking: 'Libraries/Network/RCTNetworking',
  PanResponder: 'Libraries/Interaction/PanResponder',
  PermissionsAndroid: 'Libraries/PermissionsAndroid/PermissionsAndroid',
  PixelRatio: 'Libraries/Utilities/PixelRatio',
  PushNotificationIOS: 'Libraries/PushNotificationIOS/PushNotificationIOS',
  Settings: 'Libraries/Settings/Settings',
  Share: 'Libraries/Share/Share',
  StatusBarIOS: 'Libraries/Components/StatusBar/StatusBarIOS',
  StyleSheet: 'Libraries/StyleSheet/StyleSheet',
  Systrace: 'Libraries/Performance/Systrace',
  ToastAndroid: 'Libraries/Components/ToastAndroid/ToastAndroid',
  TurboModuleRegistry: 'Libraries/TurboModule/TurboModuleRegistry',
  TVEventHandler: 'Libraries/Components/AppleTV/TVEventHandler',
  UIManager: 'Libraries/ReactNative/UIManager',
  unstable_batchedUpdates: ['Libraries/Renderer/shims/ReactNative', 'unstable_batchedUpdates'],
  useColorScheme: ['Libraries/Utilities/useColorScheme', 'default'],
  useWindowDimensions: ['Libraries/Utilities/useWindowDimensions', 'default'],
  UTFSequence: 'Libraries/UTFSequence',
  Vibration: 'Libraries/Vibration/Vibration',
  YellowBox: 'Libraries/YellowBox/YellowBoxDeprecated',
  DeviceEventEmitter: 'Libraries/EventEmitter/RCTDeviceEventEmitter',
  NativeAppEventEmitter: 'Libraries/EventEmitter/RCTNativeAppEventEmitter',
  NativeModules: 'Libraries/BatchedBridge/NativeModules',
  Platform: 'Libraries/Utilities/Platform',
  processColor: 'Libraries/StyleSheet/processColor',
  PlatformColor: ['Libraries/StyleSheet/PlatformColorValueTypes', 'PlatformColor'],
  DynamicColorIOS: ['Libraries/StyleSheet/PlatformColorValueTypesIOS', 'DynamicColorIOS'],
  ColorAndroid: ['Libraries/StyleSheet/PlatformColorValueTypesAndroid', 'ColorAndroid'],
  requireNativeComponent: 'Libraries/ReactNative/requireNativeComponent',
  unstable_RootTagContext: 'Libraries/ReactNative/RootTagContext',
  ColorPropType: 'Libraries/DeprecatedPropTypes/DeprecatedColorPropType',
  EdgeInsetsPropType: 'Libraries/DeprecatedPropTypes/DeprecatedEdgeInsetsPropType',
  PointPropType: 'Libraries/DeprecatedPropTypes/DeprecatedPointPropType',
  ViewPropTypes: 'Libraries/DeprecatedPropTypes/DeprecatedViewPropTypes',
};

const pkg = 'react-native';

const getDistLocation = importName => {
  if (!importName || importName === 'index') {
    // to prevent checking again and causing a loop
    return 'react-native/index';
  }

  if (importName && importName in MAPPING) {
    if (Array.isArray(MAPPING[importName])) {
      return [`react-native/${MAPPING[importName][0]}`, MAPPING[importName][1]];
    }
    return `react-native/${MAPPING[importName]}`;
  }
};

const isReactNativeRequire = (t, node) => {
  const { declarations } = node;
  if (declarations.length > 1) {
    return false;
  }
  const { id, init } = declarations[0];
  return (
    (t.isObjectPattern(id) || t.isIdentifier(id)) &&
    t.isCallExpression(init) &&
    t.isIdentifier(init.callee) &&
    init.callee.name === 'require' &&
    init.arguments.length === 1 &&
    init.arguments[0].value === pkg
  );
};

const isReactNativeModule = ({ source, specifiers }) =>
  source && source.value === pkg && specifiers.length;

module.exports = function({ types: t }) {
  return {
    name: 'Rewrite react-native to internal imports',
    visitor: {
      ImportDeclaration(path) {
        const { specifiers } = path.node;
        if (isReactNativeModule(path.node)) {
          const imports = specifiers
            .map(specifier => {
              if (t.isImportSpecifier(specifier)) {
                const importName = specifier.imported.name;
                let distLocation = getDistLocation(importName);

                // omit default
                if (Array.isArray(distLocation) && distLocation[1] === 'default') {
                  distLocation = distLocation[0];
                }

                if (Array.isArray(distLocation)) {
                  return t.importDeclaration(
                    [
                      t.importSpecifier(
                        t.identifier(specifier.local.name),
                        t.identifier(distLocation[1])
                      ),
                    ],
                    t.stringLiteral(distLocation[0])
                  );
                } else if (distLocation) {
                  return t.importDeclaration(
                    [t.importDefaultSpecifier(t.identifier(specifier.local.name))],
                    t.stringLiteral(distLocation)
                  );
                }
              }

              return t.importDeclaration([specifier], t.stringLiteral(getDistLocation()));
            })
            .filter(Boolean);
          path.replaceWithMultiple(imports);
        }
      },
      ExportNamedDeclaration(path) {
        const { specifiers } = path.node;
        if (isReactNativeModule(path.node)) {
          const exports = specifiers
            .map(specifier => {
              if (t.isExportSpecifier(specifier)) {
                const exportName = specifier.exported.name;
                const localName = specifier.local.name;
                const distLocation = getDistLocation(localName);

                if (Array.isArray(distLocation)) {
                  return t.exportNamedDeclaration(
                    null,
                    [
                      t.exportSpecifier(
                        t.identifier(distLocation[1]),
                        t.identifier(specifier.local.name)
                      ),
                    ],
                    t.stringLiteral(distLocation[0])
                  );
                } else if (distLocation) {
                  return t.exportNamedDeclaration(
                    null,
                    [t.exportSpecifier(t.identifier('default'), t.identifier(exportName))],
                    t.stringLiteral(distLocation)
                  );
                }
              }
              const distLocation = getDistLocation();
              return t.exportNamedDeclaration(null, [specifier], t.stringLiteral(distLocation));
            })
            .filter(Boolean);

          path.replaceWithMultiple(exports);
        }
      },
      VariableDeclaration(path) {
        if (isReactNativeRequire(t, path.node)) {
          const { id } = path.node.declarations[0];
          if (t.isObjectPattern(id)) {
            const imports = id.properties
              .map(identifier => {
                const distLocation = getDistLocation(identifier.key.name);
                if (Array.isArray(distLocation)) {
                  return t.variableDeclaration(path.node.kind, [
                    t.variableDeclarator(
                      t.identifier(identifier.value.name),
                      t.memberExpression(
                        t.callExpression(t.identifier('require'), [
                          t.stringLiteral(distLocation[0]),
                        ]),
                        t.identifier(distLocation[1])
                      )
                    ),
                  ]);
                } else if (distLocation) {
                  return t.variableDeclaration(path.node.kind, [
                    t.variableDeclarator(
                      t.identifier(identifier.value.name),
                      t.callExpression(t.identifier('require'), [t.stringLiteral(distLocation)])
                    ),
                  ]);
                }
              })
              .filter(Boolean);

            path.replaceWithMultiple(imports);
          } else if (t.isIdentifier(id)) {
            const name = id.name;
            const importIndex = t.variableDeclaration(path.node.kind, [
              t.variableDeclarator(
                t.identifier(name),
                t.callExpression(t.identifier('require'), [t.stringLiteral(getDistLocation())])
              ),
            ]);

            path.replaceWith(importIndex);
          }
        }
      },
    },
  };
};
