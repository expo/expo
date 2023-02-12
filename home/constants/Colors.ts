import { lightTheme, darkTheme } from '@expo/styleguide-native';
import { Platform } from 'react-native';

export enum ColorTheme {
  LIGHT = 'light',
  DARK = 'dark',
}

const tintColor = '#4e9bde';
const darkTintColor = '#1a74b3';
const error = '#dc3545';

export default {
  [ColorTheme.LIGHT]: {
    absolute: '#fff',
    text: '#242c39',
    tintColor,
    darkTintColor,
    navBorderBottom: 'rgba(46, 59, 76, 0.10)',
    navBackgroundColor: '#fff',
    sectionLabelBackgroundColor: '#f8f8f9',
    sectionLabelText: '#a7aab0',
    bodyBackground: lightTheme.background.screen,
    cardBackground: '#fff',
    cardSeparator: '#f4f4f5',
    cardTitle: '#242c39',
    error,
    highlightColor: '#5944ed',
    noticeText: '#fff',
    greyBackground: '#f8f8f9',
    greyText: '#a7aab0',
    greyUnderlayColor: '#f7f7f7',
    blackText: '#242c39',
    separator: '#f4f4f5',
    refreshControl: undefined,

    /**
     * Note: These colors are not actually used by the tab bar currently!
     * See: BottomTabNavigator.ts
     */
    tabIconDefault: '#bdbfc3',
    tabIconSelected: Platform.OS === 'android' ? '#000' : tintColor,
    tabBar: '#fff',
  },
  [ColorTheme.DARK]: {
    absolute: '#000',
    text: '#fff',
    tintColor: darkTintColor,
    darkTintColor: tintColor,
    navBackgroundColor: '#000',
    navBorderBottom: '#000',
    sectionLabelBackgroundColor: '#2a2a2a',
    sectionLabelText: '#fff',
    bodyBackground: darkTheme.background.screen,
    cardBackground: '#1c1c1e',
    cardSeparator: '#343437',
    cardTitle: '#fff',
    separator: '#1b1b1b',
    error,
    highlightColor: '#5944ed',
    noticeText: '#fff',
    greyBackground: '#f8f8f9',
    greyText: '#a7aab0',
    greyUnderlayColor: '#f7f7f7',
    blackText: '#242c39',
    refreshControl: '#ffffff',

    /**
     * Note: These colors are not actually used by the tab bar currently!
     * See: BottomTabNavigator.ts
     */
    tabBar: '#000',
    tabIconDefault: '#bdbfc3',
    tabIconSelected: Platform.OS === 'android' ? '#fff' : tintColor,
  },
};
