import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';
import { createMaterialBottomTabNavigator } from 'react-navigation-material-bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import { Colors, Layout } from '../constants';

import BarCodeScannerScreen from '../screens/BarCodeScannerScreen';
import BlurViewScreen from '../screens/BlurViewScreen';
import DocumentPickerScreen from '../screens/DocumentPickerScreen';
import ExpoComponentsScreen from '../screens/ExpoComponentsScreen';
import ExpoApisScreen from '../screens/ExpoApisScreen';
import FileSystemScreen from '../screens/FileSystemScreen';
import FontScreen from '../screens/FontScreen';
import GifScreen from '../screens/GifScreen';
import CalendarsScreen from '../screens/CalendarsScreen';
import ConstantsScreen from '../screens/ConstantsScreen';
import ContactsScreen from '../screens/Contacts/ContactsScreen';
import ContactDetailScreen from '../screens/Contacts/ContactDetailScreen';
import EventsScreen from '../screens/EventsScreen';
import AuthSessionScreen from '../screens/AuthSessionScreen';
import FacebookLoginScreen from '../screens/FacebookLoginScreen';
import GestureHandlerPinchScreen from '../screens/GestureHandlerPinchScreen';
import GestureHandlerListScreen from '../screens/GestureHandlerListScreen';
import GestureHandlerSwipeableScreen from '../screens/GestureHandlerSwipeableScreen';
import GoogleLoginScreen from '../screens/GoogleLoginScreen';
import RemindersScreen from '../screens/RemindersScreen';
import SensorScreen from '../screens/SensorScreen';
import GeocodingScreen from '../screens/GeocodingScreen';
import GLScreens from '../screens/GL/GLScreens';
import ImageManipulatorScreen from '../screens/ImageManipulatorScreen';
import ImagePickerScreen from '../screens/ImagePickerScreen';
import ImagePreviewScreen from '../screens/Reanimated/ImagePreviewScreen';
import IntentLauncherScreen from '../screens/IntentLauncherScreen';
import LinearGradientScreen from '../screens/LinearGradientScreen';
import LocalAuthenticationScreen from '../screens/LocalAuthenticationScreen';
import KeepAwakeScreen from '../screens/KeepAwakeScreen';
import FacebookAdsScreen from '../screens/FacebookAdsScreen';
import MailComposerScreen from '../screens/MailComposerScreen';
import ReactNativeCoreScreen from '../screens/ReactNativeCoreScreen';
import TextToSpeechScreen from '../screens/TextToSpeechScreen';
import ScreenOrientationScreen from '../screens/ScreenOrientationScreen';
import SecureStoreScreen from '../screens/SecureStoreScreen';
import SVGScreen from '../screens/SVGScreen';
import LocationScreen from '../screens/LocationScreen';
import LottieScreen from '../screens/LottieScreen';
import MapsScreen from '../screens/MapsScreen';
import NotificationScreen from '../screens/NotificationScreen';
import PedometerScreen from '../screens/PedometerScreen';
import MediaLibraryScreens from '../screens/MediaLibrary/MediaLibraryScreens';
import BasicMaskScreen from '../screens/BasicMaskScreen';
import MaskGLScreen from '../screens/MaskGLScreen';
import AdMobScreen from '../screens/AdMobScreen';
import UtilScreen from '../screens/UtilScreen';
import VideoScreen from '../screens/VideoScreen';
import WebBrowserScreen from '../screens/WebBrowserScreen';
import PrintScreen from '../screens/PrintScreen';
import LocalizationScreen from '../screens/LocalizationScreen';
import HapticScreen from '../screens/HapticScreen';
import StoreReview from '../screens/StoreReview';
import BranchScreen from '../screens/BranchScreen';
import SMSScreen from '../screens/SMSScreen';
import ScreensScreen from '../screens/Screens';
import PermissionsScreen from '../screens/PermissionsScreen';

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    paddingTop: 5,
    paddingBottom: 1,
    paddingHorizontal: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.tabIconDefault,
  },
  tabBarLabel: {
    fontSize: 10,
    letterSpacing: 0,
  },
  header: {
    backgroundColor: '#fff',
  },
  headerTitle: {
    color: '#000000',
  },
  card: {
    backgroundColor: '#fafafa',
  },
});

const StackConfig = {
  cardStyle: styles.card,
  headerTransitionPreset: 'uikit',
  navigationOptions: () => ({
    headerStyle: styles.header,
    headerTintColor: Colors.tintColor,
    headerTitleStyle: styles.headerTitle,
    headerPressColorAndroid: Colors.tintColor,
  }),
};

const ExpoComponentsStackNavigator = createStackNavigator(
  {
    ExpoComponents: { screen: ExpoComponentsScreen },
    AdMob: { screen: AdMobScreen },
    BarCodeScanner: { screen: BarCodeScannerScreen },
    BlurView: { screen: BlurViewScreen },
    ...GLScreens,
    GestureHandlerPinch: { screen: GestureHandlerPinchScreen },
    GestureHandlerList: { screen: GestureHandlerListScreen },
    GestureHandlerSwipeable: { screen: GestureHandlerSwipeableScreen },
    ImagePreview: { screen: ImagePreviewScreen },
    Gif: { screen: GifScreen },
    FacebookAds: { screen: FacebookAdsScreen },
    SVG: { screen: SVGScreen },
    LinearGradient: { screen: LinearGradientScreen },
    Lottie: { screen: LottieScreen },
    Maps: { screen: MapsScreen },
    Video: { screen: VideoScreen },
    Screens: { screen: ScreensScreen },
  },
  StackConfig
);

const ExpoApisStackNavigator = createStackNavigator(
  {
    ExpoApis: { screen: ExpoApisScreen },
    AuthSession: { screen: AuthSessionScreen },
    Branch: { screen: BranchScreen },
    DocumentPicker: { screen: DocumentPickerScreen },
    Localization: { screen: LocalizationScreen },
    FacebookLogin: { screen: FacebookLoginScreen },
    FileSystem: { screen: FileSystemScreen },
    Font: { screen: FontScreen },
    GoogleLogin: { screen: GoogleLoginScreen },
    Haptic: { screen: HapticScreen },
    Calendars: { screen: CalendarsScreen },
    Constants: { screen: ConstantsScreen },
    Contacts: ContactsScreen,
    ContactDetail: ContactDetailScreen,
    Events: { screen: EventsScreen },
    Geocoding: { screen: GeocodingScreen },
    ImageManipulator: { screen: ImageManipulatorScreen },
    ImagePicker: { screen: ImagePickerScreen },
    IntentLauncher: { screen: IntentLauncherScreen },
    KeepAwake: { screen: KeepAwakeScreen },
    MailComposer: { screen: MailComposerScreen },
    ...MediaLibraryScreens,
    Notification: { screen: NotificationScreen },
    LocalAuthentication: { screen: LocalAuthenticationScreen },
    Location: { screen: LocationScreen },
    Pedometer: { screen: PedometerScreen },
    Permissions: PermissionsScreen,
    Print: { screen: PrintScreen },
    Reminders: { screen: RemindersScreen },
    ScreenOrientation: { screen: ScreenOrientationScreen },
    SecureStore: { screen: SecureStoreScreen },
    Sensor: { screen: SensorScreen },
    SMS: { screen: SMSScreen },
    StoreReview: { screen: StoreReview },
    TextToSpeech: { screen: TextToSpeechScreen },
    Util: { screen: UtilScreen },
    WebBrowser: { screen: WebBrowserScreen },
  },
  StackConfig
);

const ReactNativeCoreStackNavigator = createStackNavigator(
  {
    ReactNativeCore: { screen: ReactNativeCoreScreen },
    BasicMaskExample: { screen: BasicMaskScreen },
    GLMaskExample: { screen: MaskGLScreen },
  },
  StackConfig
);

class TabIcon extends React.Component {
  render() {
    let baseSize = this.props.size || 26;
    return (
      <MaterialIcons
        name={this.props.name}
        size={Platform.OS === 'android' ? baseSize - 2 : baseSize}
        color={this.props.focused ? Colors.tabIconSelected : Colors.tabIconDefault}
      />
    );
  }
}

const createTabNavigator =
  Platform.OS === 'android' ? createMaterialBottomTabNavigator : createBottomTabNavigator;

const MainTabNavigator = createTabNavigator(
  {
    ExpoApis: { screen: ExpoApisStackNavigator },
    ExpoComponents: { screen: ExpoComponentsStackNavigator },
    ReactNativeCore: { screen: ReactNativeCoreStackNavigator },
  },
  {
    navigationOptions: ({ navigation }) => {
      let tabBarLabel;
      const { routeName } = navigation.state;
      if (routeName === 'ReactNativeCore') {
        tabBarLabel = Layout.isSmallDevice ? 'RN Core' : 'React Native Core';
      } else if (routeName === 'ExpoComponents') {
        tabBarLabel = Layout.isSmallDevice ? 'Components' : 'Expo Components';
      } else if (routeName === 'ExpoApis') {
        tabBarLabel = Layout.isSmallDevice ? 'APIs' : 'Expo APIs';
      }

      return {
        header: null,
        tabBarLabel,
        tabBarIcon: ({ focused }) => {
          const { routeName } = navigation.state;
          if (routeName === 'ReactNativeCore') {
            return <TabIcon name="group-work" focused={focused} />;
          } else if (routeName === 'ExpoComponents') {
            return <TabIcon name="filter" focused={focused} size={25} />;
          } else if (routeName === 'ExpoApis') {
            return <TabIcon name="functions" focused={focused} size={28} />;
          }
        },
      };
    },
    /* Below applies to material bottom tab navigator */
    activeTintColor: Colors.tabIconSelected,
    inactiveTintColor: Colors.tabIconDefault,
    shifting: true,
    barStyle: {
      backgroundColor: '#fff',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: Colors.tabIconDefault,
    },
    /* Below applies to bottom tab navigator */
    tabBarOptions: {
      style: styles.tabBar,
      labelStyle: styles.tabBarLabel,
      activeTintColor: Colors.tabIconSelected,
      inactiveTintColor: Colors.tabIconDefault,
    },
  }
);

export default MainTabNavigator;
