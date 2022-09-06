import { HomeFilledIcon, SettingsFilledIcon } from '@expo/styleguide-native';
import {
  NavigationContainer,
  useTheme,
  NavigationContainerRef,
  RouteProp,
} from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import * as React from 'react';
import { Platform, StyleSheet, Linking } from 'react-native';

import DiagnosticsIcon from '../components/Icons';
import { ColorTheme } from '../constants/Colors';
import Themes from '../constants/Themes';
import { AccountModal } from '../screens/AccountModal';
import AudioDiagnosticsScreen from '../screens/AudioDiagnosticsScreen';
import { BranchDetailsScreen } from '../screens/BranchDetailsScreen';
import { BranchListScreen } from '../screens/BranchListScreen';
import { DeleteAccountScreen } from '../screens/DeleteAccountScreen';
import { DiagnosticsScreen } from '../screens/DiagnosticsScreen';
import GeofencingScreen from '../screens/GeofencingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import LocationDiagnosticsScreen from '../screens/LocationDiagnosticsScreen';
import { ProjectScreen } from '../screens/ProjectScreen';
import { ProjectsListScreen } from '../screens/ProjectsListScreen';
import QRCodeScreen from '../screens/QRCodeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SnacksListScreen } from '../screens/SnacksListScreen';
import {
  alertWithCameraPermissionInstructions,
  requestCameraPermissionsAsync,
} from '../utils/PermissionUtils';
import BottomTab, { getNavigatorProps } from './BottomTabNavigator';
import { DiagnosticsStackRoutes, HomeStackRoutes, SettingsStackRoutes } from './Navigation.types';
import defaultNavigationOptions from './defaultNavigationOptions';

// TODO(Bacon): Do we need to create a new one each time?
const HomeStack = createStackNavigator<HomeStackRoutes>();
const SettingsStack = createStackNavigator<SettingsStackRoutes>();

function useThemeName() {
  const theme = useTheme();
  return theme.dark ? ColorTheme.DARK : ColorTheme.LIGHT;
}

function HomeStackScreen() {
  const themeName = useThemeName();

  return (
    <HomeStack.Navigator
      initialRouteName="Home"
      screenOptions={defaultNavigationOptions(themeName)}>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <HomeStack.Screen
        name="ProjectsList"
        component={ProjectsListScreen}
        options={{
          title: 'Projects',
        }}
      />
      <HomeStack.Screen
        name="SnacksList"
        component={SnacksListScreen}
        options={{
          title: 'Snacks',
        }}
      />
      <HomeStack.Screen
        name="ProjectDetails"
        component={ProjectScreen}
        options={{
          title: 'Project',
        }}
      />
      <HomeStack.Screen
        name="Branches"
        component={BranchListScreen}
        options={{
          title: 'Branches',
        }}
      />
      <HomeStack.Screen
        name="BranchDetails"
        component={BranchDetailsScreen}
        options={{
          title: 'Branch',
        }}
      />
    </HomeStack.Navigator>
  );
}

function SettingsStackScreen() {
  const themeName = useThemeName();

  return (
    <SettingsStack.Navigator
      initialRouteName="Settings"
      screenOptions={defaultNavigationOptions(themeName)}>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
      <SettingsStack.Screen
        name="DeleteAccount"
        component={DeleteAccountScreen}
        options={{
          title: 'Delete Account',
        }}
      />
    </SettingsStack.Navigator>
  );
}

const DiagnosticsStack = createStackNavigator<DiagnosticsStackRoutes>();

function DiagnosticsStackScreen() {
  const theme = useThemeName();
  return (
    <DiagnosticsStack.Navigator
      initialRouteName="Diagnostics"
      screenOptions={defaultNavigationOptions(theme)}>
      <DiagnosticsStack.Screen
        name="Diagnostics"
        component={DiagnosticsScreen}
        options={{
          title: 'Diagnostics',
        }}
      />
      <DiagnosticsStack.Screen
        name="Audio"
        component={AudioDiagnosticsScreen}
        options={{ title: 'Audio Diagnostics' }}
      />
      <DiagnosticsStack.Screen
        name="Location"
        component={LocationDiagnosticsScreen}
        options={{ title: 'Location Diagnostics' }}
      />
      <DiagnosticsStack.Screen
        name="Geofencing"
        component={GeofencingScreen}
        options={{ title: 'Geofencing' }}
      />
    </DiagnosticsStack.Navigator>
  );
}

const RootStack = createStackNavigator();

function TabNavigator(props: { theme: string }) {
  return (
    <BottomTab.Navigator {...getNavigatorProps(props)} initialRouteName="HomeStack">
      <BottomTab.Screen
        name="HomeStack"
        component={HomeStackScreen}
        options={{
          tabBarIcon: ({ color }) => <HomeFilledIcon style={styles.icon} color={color} size={24} />,
          tabBarLabel: 'Home',
        }}
      />

      {Platform.OS === 'ios' && (
        <BottomTab.Screen
          name="DiagnosticsStack"
          component={DiagnosticsStackScreen}
          options={{
            tabBarIcon: (props) => <DiagnosticsIcon {...props} style={styles.icon} size={24} />,
            tabBarLabel: 'Diagnostics',
          }}
        />
      )}
      <BottomTab.Screen
        name="SettingsScreen"
        component={SettingsStackScreen}
        options={{
          title: 'Settings',
          tabBarIcon: (props) => <SettingsFilledIcon {...props} style={styles.icon} size={24} />,
          tabBarLabel: 'Settings',
        }}
      />
    </BottomTab.Navigator>
  );
}

const ModalStack = createStackNavigator();

export default (props: { theme: ColorTheme }) => {
  const navigationRef = React.useRef<NavigationContainerRef>(null);
  const isNavigationReadyRef = React.useRef(false);
  const initialURLWasConsumed = React.useRef(false);

  React.useEffect(() => {
    const handleDeepLinks = async ({ url }: { url: string | null }) => {
      if (Platform.OS === 'ios' || !url || !isNavigationReadyRef.current) {
        return;
      }
      const nav = navigationRef.current;
      if (!nav) {
        return;
      }

      if (url.startsWith('expo-home://qr-scanner')) {
        if (await requestCameraPermissionsAsync()) {
          nav.navigate('QRCode');
        } else {
          await alertWithCameraPermissionInstructions();
        }
      }
    };
    if (!initialURLWasConsumed.current) {
      initialURLWasConsumed.current = true;
      Linking.getInitialURL().then((url) => {
        handleDeepLinks({ url });
      });
    }

    const deepLinkSubscription = Linking.addEventListener('url', handleDeepLinks);

    return () => {
      isNavigationReadyRef.current = false;
      deepLinkSubscription.remove();
    };
  }, []);

  return (
    <NavigationContainer
      theme={Themes[props.theme]}
      ref={navigationRef}
      onReady={() => {
        isNavigationReadyRef.current = true;
      }}>
      <ModalStack.Navigator
        initialRouteName="RootStack"
        screenOptions={({ route, navigation }) => ({
          headerShown: false,
          gestureEnabled: true,
          cardOverlayEnabled: true,
          cardStyle: { backgroundColor: 'transparent' },
          headerStatusBarHeight:
            navigation.dangerouslyGetState().routes.indexOf(route) > 0 ? 0 : undefined,
          ...TransitionPresets.ModalPresentationIOS,
        })}
        mode="modal">
        <ModalStack.Screen name="RootStack">
          {() => (
            <RootStack.Navigator initialRouteName="Tabs" mode="modal">
              <RootStack.Screen name="Tabs" options={{ headerShown: false }}>
                {() => <TabNavigator theme={props.theme} />}
              </RootStack.Screen>
              <RootStack.Screen
                name="Account"
                component={AccountModal}
                options={({ route, navigation }) => ({
                  title: 'Account',
                  ...(Platform.OS === 'ios' && {
                    headerShown: false,
                    gestureEnabled: true,
                    cardOverlayEnabled: true,
                    headerStatusBarHeight:
                      navigation
                        .dangerouslyGetState()
                        .routes.findIndex((r: RouteProp<any, any>) => r.key === route.key) > 0
                        ? 0
                        : undefined,
                    ...TransitionPresets.ModalPresentationIOS,
                  }),
                })}
              />
            </RootStack.Navigator>
          )}
        </ModalStack.Screen>
        <ModalStack.Screen name="QRCode" component={QRCodeScreen} />
      </ModalStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  icon: {
    marginBottom: Platform.OS === 'ios' ? -3 : 0,
  },
});
