import React from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Animated,
  AppRegistry,
  AppState,
  Appearance,
  BackHandler,
  Button,
  // CheckBox,
  Clipboard,
  DeviceEventEmitter,
  // DeviceInfo,
  Dimensions,
  DrawerLayoutAndroid,
  Easing,
  FlatList,
  I18nManager,
  Image,
  ImageBackground,
  InputAccessoryView,
  InteractionManager,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Linking,
  LogBox,
  Modal,
  NativeEventEmitter,
  NativeModules,
  PanResponder,
  PermissionsAndroid,
  // Picker,
  PixelRatio,
  Platform,
  Pressable,
  // ProgressBar,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  SectionList,
  Settings,
  Share,
  StatusBar,
  StyleSheet,
  Switch,
  Systrace,
  // TVEventHandler,
  Text,
  TextInput,
  ToastAndroid,
  Touchable,
  TouchableHighlight,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  Vibration,
  View,
  VirtualizedList,
  YellowBox,
  // createElement,
  findNodeHandle,
  processColor,
  // render,
  // unmountComponentAtNode,
  // useColorScheme,
  // useLocaleContext,
  // useWindowDimensions,
} from 'react-native';

it(`can use utility functions`, () => {
  expect(findNodeHandle()).toBe(undefined);
  expect(processColor('red')).toBe(4294901760);
});

Object.entries({
  View,
  ActivityIndicator,
  StatusBar,
  Text,
  ImageBackground,
  InputAccessoryView,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  Switch,
  Pressable,
  Modal,
}).forEach(([name, Component]) => {
  it(`renders ${name} to RSC`, async () => {
    const jsx = <Component />;

    await expect(jsx).toMatchFlightSnapshot();
  });
});
Object.entries({
  TouchableNativeFeedback,
  TouchableHighlight,
  TouchableOpacity,
  TouchableWithoutFeedback,
}).forEach(([name, Component]) => {
  it(`renders touchable ${name} to RSC`, async () => {
    await expect(
      <Component>
        <Text>{name}</Text>
      </Component>
    ).toMatchFlightSnapshot();
  });
});

it(`renders Button to RSC`, async () => {
  await expect(<Button title="button" />).toMatchFlightSnapshot();
});
it(`renders Image to RSC`, async () => {
  await expect(
    <Image source={{ uri: 'https://github.com/evanbacon.png' }} />
  ).toMatchFlightSnapshot();
});
it(`renders TextInput to RSC`, async () => {
  await expect(<TextInput value="Text Input" />).toMatchFlightSnapshot();
});
it(`renders Text to RSC`, async () => {
  await expect(<Text>Hello</Text>).toMatchFlightSnapshot();
});
it(`renders Text to RSC`, async () => {
  await expect(<Text>Hello</Text>).toMatchFlightSnapshot();
});
