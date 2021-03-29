import Entypo from '@expo/vector-icons/build/Entypo';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { NavigationContainer, useTheme } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import Constants from 'expo-constants';
import * as React from 'react';
import { Platform, StyleSheet } from 'react-native';

import OpenProjectByURLButton from '../components/OpenProjectByURLButton.ios';
import OptionsButton from '../components/OptionsButton';
import UserSettingsButton from '../components/UserSettingsButton';
import * as Themes from '../constants/Themes';
import AccountScreen from '../screens/AccountScreen';
import AudioDiagnosticsScreen from '../screens/AudioDiagnosticsScreen';
import DiagnosticsScreen from '../screens/DiagnosticsScreen';
import ExperienceScreen from '../screens/ExperienceScreen';
import GeofencingScreen from '../screens/GeofencingScreen';
import LocationDiagnosticsScreen from '../screens/LocationDiagnosticsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProjectsForAccountScreen from '../screens/ProjectsForAccountScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import QRCodeScreen from '../screens/QRCodeScreen';
import SnacksForAccountScreen from '../screens/SnacksForAccountScreen';
import UserSettingsScreen from '../screens/UserSettingsScreen';
import Environment from '../utils/Environment';
import BottomTab, { getNavigatorProps } from './BottomTabNavigator';
import defaultNavigationOptions from './defaultNavigationOptions';

// TODO(Bacon): Do we need to create a new one each time?
const ProjectsStack = createStackNavigator();

function useThemeName() {
  const theme = useTheme();
  return theme.dark ? 'dark' : 'light';
}

const accountNavigationOptions = ({ route }) => {
  const accountName = route.params?.accountName;
  return {
    title: `@${accountName}`,
    headerRight: () => <OptionsButton />,
  };
};

const profileNavigationOptions = ({ route }) => {
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

const ProfileStack = createStackNavigator();

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
    </ProfileStack.Navigator>
  );
}

const DiagnosticsStack = createStackNavigator();

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
          tabBarIcon: props => <Entypo {...props} style={styles.icon} name="grid" size={24} />,
          tabBarLabel: 'Projects',
        }}
      />
      {Platform.OS === 'ios' && (
        <BottomTab.Screen
          name="DiagnosticsStack"
          component={DiagnosticsStackScreen}
          options={{
            tabBarIcon: props => (
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
          tabBarIcon: props => (
            <Ionicons {...props} style={styles.icon} name="ios-person" size={26} />
          ),
          tabBarLabel: 'Profile',
        }}
      />
    </BottomTab.Navigator>
  );
}

const ModalStack = createStackNavigator();

export default (props: { theme: string }) => {
  const linking = {
    prefixes: ['expo-home://'],
    config: {
      initialRouteName: 'RootStack',
      screens: {
        QRCode: 'qr-scanner',
      },
    },
  };

  return (
    <NavigationContainer theme={Themes[props.theme]} linking={linking}>
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
        <ModalStack.Screen name="Experience" component={ExperienceScreen} />
      </ModalStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  icon: {
    marginBottom: Platform.OS === 'ios' ? -3 : 0,
  },
});
