import Entypo from '@expo/vector-icons/build/Entypo';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import {
  NavigationContainer,
  useTheme,
  NavigationContainerRef,
  RouteProp,
} from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import Constants from 'expo-constants';
import * as React from 'react';
import { Platform, StyleSheet, Linking } from 'react-native';

import OpenProjectByURLButton from '../components/OpenProjectByURLButton.ios';
import OptionsButton from '../components/OptionsButton';
import UserSettingsButton from '../components/UserSettingsButton';
import { ColorTheme } from '../constants/Colors';
import Themes from '../constants/Themes';
import AccountScreen from '../screens/AccountScreen';
import AudioDiagnosticsScreen from '../screens/AudioDiagnosticsScreen';
import DiagnosticsScreen from '../screens/DiagnosticsScreen';
import GeofencingScreen from '../screens/GeofencingScreen';
import LocationDiagnosticsScreen from '../screens/LocationDiagnosticsScreen';
import ProfileAllProjectsScreen from '../screens/ProfileAllProjectsScreen';
import ProfileAllSnacksScreen from '../screens/ProfileAllSnacksScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProjectScreen from '../screens/ProjectScreen';
import ProjectsForAccountScreen from '../screens/ProjectsForAccountScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import QRCodeScreen from '../screens/QRCodeScreen';
import SnacksForAccountScreen from '../screens/SnacksForAccountScreen';
import UserSettingsScreen from '../screens/UserSettingsScreen';
import Environment from '../utils/Environment';
import {
  alertWithCameraPermissionInstructions,
  requestCameraPermissionsAsync,
} from '../utils/PermissionUtils';
import BottomTab, { getNavigatorProps } from './BottomTabNavigator';
import {
  DiagnosticsStackRoutes,
  ProfileStackRoutes,
  ProjectsStackRoutes,
} from './Navigation.types';
import defaultNavigationOptions from './defaultNavigationOptions';

// TODO(Bacon): Do we need to create a new one each time?
const ProjectsStack = createStackNavigator<ProjectsStackRoutes>();

function useThemeName() {
  const theme = useTheme();
  return theme.dark ? ColorTheme.DARK : ColorTheme.LIGHT;
}

const accountNavigationOptions = ({
  route,
}: {
  route: RouteProp<ProfileStackRoutes, 'Account'>;
}) => {
  const accountName = route.params?.accountName;
  return {
    title: `@${accountName}`,
    headerRight: () => <OptionsButton />,
  };
};

const profileNavigationOptions = () => {
  return {
    title: 'Profile',
    headerRight: () => <UserSettingsButton />,
  };
};

function ProjectsStackScreen() {
  const theme = useThemeName();
  return (
    <ProjectsStack.Navigator
      initialRouteName="Projects"
      screenOptions={defaultNavigationOptions(theme)}>
      <ProjectsStack.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{
          title: 'Projects',
          ...Platform.select({
            ios: {
              headerRight: () => (Constants.isDevice ? null : <OpenProjectByURLButton />),
            },
          }),
        }}
      />
    </ProjectsStack.Navigator>
  );
}

const ProfileStack = createStackNavigator<ProfileStackRoutes>();

function ProfileStackScreen() {
  const theme = useThemeName();
  return (
    <ProfileStack.Navigator
      initialRouteName="Profile"
      screenOptions={defaultNavigationOptions(theme)}>
      <ProfileStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={profileNavigationOptions}
      />
      <ProfileStack.Screen
        name="ProfileAllProjects"
        component={ProfileAllProjectsScreen}
        options={{ title: 'Projects' }}
      />
      <ProfileStack.Screen
        name="ProfileAllSnacks"
        component={ProfileAllSnacksScreen}
        options={{ title: 'Snacks' }}
      />
      <ProfileStack.Screen
        name="Account"
        component={AccountScreen}
        options={accountNavigationOptions}
      />
      <ProfileStack.Screen
        name="UserSettings"
        component={UserSettingsScreen}
        options={{ title: 'Options' }}
      />
      <ProfileStack.Screen
        name="ProjectsForAccount"
        component={ProjectsForAccountScreen}
        options={{ title: 'Projects' }}
      />
      <ProfileStack.Screen
        name="SnacksForAccount"
        component={SnacksForAccountScreen}
        options={{ title: 'Snacks' }}
      />
      <ProfileStack.Screen name="Project" component={ProjectScreen} />
    </ProfileStack.Navigator>
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
        options={{ title: 'Diagnostics' }}
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
  const initialRouteName = Environment.IsIOSRestrictedBuild
    ? 'ProfileStackScreen'
    : 'ProjectsStack';

  return (
    <BottomTab.Navigator {...getNavigatorProps(props)} initialRouteName={initialRouteName}>
      <BottomTab.Screen
        name="ProjectsStack"
        component={ProjectsStackScreen}
        options={{
          tabBarIcon: (props) => <Entypo {...props} style={styles.icon} name="grid" size={24} />,
          tabBarLabel: 'Projects',
        }}
      />
      {Platform.OS === 'ios' && (
        <BottomTab.Screen
          name="DiagnosticsStack"
          component={DiagnosticsStackScreen}
          options={{
            tabBarIcon: (props) => (
              <Ionicons {...props} style={styles.icon} name="ios-git-branch" size={26} />
            ),
            tabBarLabel: 'Diagnostics',
          }}
        />
      )}
      <BottomTab.Screen
        name="ProfileStack"
        component={ProfileStackScreen}
        options={{
          tabBarIcon: (props) => (
            <Ionicons {...props} style={styles.icon} name="ios-person" size={26} />
          ),
          tabBarLabel: 'Profile',
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

    Linking.addEventListener('url', handleDeepLinks);

    return () => {
      isNavigationReadyRef.current = false;
      Linking.removeEventListener('url', handleDeepLinks);
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
