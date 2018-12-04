import { createAppContainer } from 'react-navigation';
import { createBrowserApp } from '@react-navigation/web';
import { Platform } from 'expo-core';
import MainTabNavigator from './MainTabNavigator.web';

const createContainer = Platform.OS === 'web' ? createBrowserApp : createAppContainer;
export default createContainer(MainTabNavigator);
