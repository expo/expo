import Entypo from '@expo/vector-icons/build/Entypo';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { NavigationContainer, useTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Constants from 'expo-constants';
import * as React from 'react';
import { Platform, StyleSheet } from 'react-native';

import CloseButton from '../components/CloseButton';
import OpenProjectByURLButton from '../components/OpenProjectByURLButton.ios';
import OptionsButton from '../components/OptionsButton';
import UserSettingsButton from '../components/UserSettingsButton';
import Colors from '../constants/Colors';
import * as Themes from '../constants/Themes';
import AudioDiagnosticsScreen from '../screens/AudioDiagnosticsScreen';
import DiagnosticsScreen from '../screens/DiagnosticsScreen';
import ExploreScreen from '../screens/ExploreScreen';
import GeofencingScreen from '../screens/GeofencingScreen';
import LocationDiagnosticsScreen from '../screens/LocationDiagnosticsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProjectsForUserScreen from '../screens/ProjectsForUserScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import QRCodeScreen from '../screens/QRCodeScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SnacksForUserScreen from '../screens/SnacksForUserScreen';
import UserSettingsScreen from '../screens/UserSettingsScreen';
import Environment from '../utils/Environment';
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

function ProjectsStackScreen(props) {
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

const BottomTab = createBottomTabNavigator();

const MaterialBottomTab = createMaterialBottomTabNavigator();

const RootStack = createStackNavigator();

export default (props: { theme: string }) => (
  <NavigationContainer theme={Themes[props.theme]}>
    <RootStack.Navigator initialRouteName="Tabs" mode="modal">
      <RootStack.Screen name="Tabs" options={{ headerShown: false }}>
        {() => {
          const projectsNavigationOptions = () => ({
            tabBarIcon: props => <Entypo {...props} style={styles.icon} name="grid" size={24} />,
            tabBarLabel: 'Projects',
          });
          const profileNavigationOptions = () => ({
            tabBarIcon: props => (
              <Ionicons {...props} style={styles.icon} name="ios-person" size={26} />
            ),
            tabBarLabel: 'Profile',
          });
          const diagnosticsNavigationOptions = () => ({
            tabBarIcon: props => (
              <Ionicons {...props} style={styles.icon} name="ios-git-branch" size={26} />
            ),
            tabBarLabel: 'Diagnostics',
          });
          const exploreNavigationOptions = () => ({
            tabBarIcon: props => (
              <Ionicons {...props} style={styles.icon} name="ios-search" size={24} />
            ),
            tabBarLabel: 'Explore',
            tabBarOnPress: ({ navigation, defaultHandler }) => {
              if (!navigation.isFocused()) {
                defaultHandler();
                return;
              }

              navigation.popToTop();

              if (navigation.state.routes[0].index > 0) {
                navigation.navigate('Explore');
              } else {
                navigation.emit('refocus');
              }
            },
          });

          if (Platform.OS === 'ios') {
            return (
              <BottomTab.Navigator
                tabBarOptions={{ labelStyle: { fontWeight: '600' } }}
                initialRouteName={
                  Environment.IsIOSRestrictedBuild ? 'ProfileStackScreen' : 'ProjectsStack'
                }>
                <BottomTab.Screen
                  name="ProjectsStack"
                  component={ProjectsStackScreen}
                  options={projectsNavigationOptions}
                />
                {!Environment.IsIOSRestrictedBuild && (
                  <BottomTab.Screen
                    name="ExploreStack"
                    component={ExploreStackScreen}
                    options={exploreNavigationOptions}
                  />
                )}
                <BottomTab.Screen
                  name="DiagnosticsStack"
                  component={DiagnosticsStackScreen}
                  options={diagnosticsNavigationOptions}
                />
                <BottomTab.Screen
                  name="ProfileStack"
                  component={ProfileStackScreen}
                  options={profileNavigationOptions}
                />
              </BottomTab.Navigator>
            );
          }
          return (
            <MaterialBottomTab.Navigator
              initialRouteName="ProjectsStack"
              shifting
              activeColor={Colors[props.theme].tabIconSelected}
              inactiveColor={Colors[props.theme].tabIconDefault}
              barStyle={{
                backgroundColor: Colors[props.theme].cardBackground,
                borderTopWidth:
                  props.theme === 'dark' ? StyleSheet.hairlineWidth * 2 : StyleSheet.hairlineWidth,
                borderTopColor: Colors[props.theme].cardSeparator,
              }}>
              <MaterialBottomTab.Screen
                name="ProjectsStack"
                component={ProjectsStackScreen}
                options={projectsNavigationOptions}
              />
              <MaterialBottomTab.Screen
                name="ExploreStack"
                component={ExploreStackScreen}
                options={exploreNavigationOptions}
              />
              <MaterialBottomTab.Screen
                name="ProfileStack"
                component={ProfileStackScreen}
                options={profileNavigationOptions}
              />
            </MaterialBottomTab.Navigator>
          );
        }}
      </RootStack.Screen>
      <RootStack.Screen
        name="SignIn"
        component={SignInScreen}
        options={{
          title: 'Sign In',
          headerLeft: () => <CloseButton />,
        }}
      />
      <RootStack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{
          title: 'Sign Up',
          headerLeft: () => <CloseButton />,
        }}
      />
      <RootStack.Screen
        name="QRCode"
        component={QRCodeScreen}
        options={{
          headerShown: false,
          // stackPresentation: 'modal',
        }}
      />
    </RootStack.Navigator>
  </NavigationContainer>
);

const styles = StyleSheet.create({
  icon: {
    marginBottom: Platform.OS === 'ios' ? -3 : 0,
  },
});
