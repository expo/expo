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
import AudioDiagnosticsScreen from '../screens/AudioDiagnosticsScreen';
import DiagnosticsScreen from '../screens/DiagnosticsScreen';
import ExperienceScreen from '../screens/ExperienceScreen';
import ExploreScreen from '../screens/ExploreScreen';
import GeofencingScreen from '../screens/GeofencingScreen';
import LocationDiagnosticsScreen from '../screens/LocationDiagnosticsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProjectsForUserScreen from '../screens/ProjectsForUserScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import QRCodeScreen from '../screens/QRCodeScreen';
import SnacksForUserScreen from '../screens/SnacksForUserScreen';
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

const profileNavigationOptions = ({ route }) => {
  const username = route.params?.username;
  return {
    title: username ?? 'Profile',
    headerRight: () => (username ? <OptionsButton /> : <UserSettingsButton />),
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
      <ProjectsStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={profileNavigationOptions}
      />
    </ProjectsStack.Navigator>
  );
}

const ExploreStack = createStackNavigator();

function ExploreStackScreen() {
  const theme = useThemeName();
  return (
    <ExploreStack.Navigator
      initialRouteName="ExploreAndSearch"
      screenOptions={defaultNavigationOptions(theme)}>
      <ExploreStack.Screen
        name="ExploreAndSearch"
        component={ExploreScreen}
        options={{ title: 'Explore' }}
      />
      <ExploreStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={profileNavigationOptions}
      />
      <ExploreStack.Screen
        name="ProjectsForUser"
        component={ProjectsForUserScreen}
        options={{ title: 'Projects' }}
      />
      <ExploreStack.Screen
        name="SnacksForUser"
        component={SnacksForUserScreen}
        options={{ title: 'Snacks' }}
      />
    </ExploreStack.Navigator>
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
        name="UserSettings"
        component={UserSettingsScreen}
        options={{ title: 'Options' }}
      />
      <ProfileStack.Screen
        name="ProjectsForUser"
        component={ProjectsForUserScreen}
        options={{ title: 'Projects' }}
      />
      <ProfileStack.Screen
        name="SnacksForUser"
        component={SnacksForUserScreen}
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
      {!Environment.IsIOSRestrictedBuild && (
        <BottomTab.Screen
          name="ExploreStack"
          component={ExploreStackScreen}
          options={{
            tabBarIcon: props => (
              <Ionicons {...props} style={styles.icon} name="ios-search" size={24} />
            ),
            tabBarLabel: 'Explore',
          }}
        />
      )}
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

export default (props: { theme: string }) => (
  <NavigationContainer theme={Themes[props.theme]}>
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

const styles = StyleSheet.create({
  icon: {
    marginBottom: Platform.OS === 'ios' ? -3 : 0,
  },
});
