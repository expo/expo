import { Platform } from 'react-native';

const tintColor = '#4e9bde';
const darkTintColor = '#1a74b3';

export default {
  light: {
    absolute: '#fff',
    text: '#242c39',
    tintColor,
    darkTintColor,
    navBorderBottom: 'rgba(46, 59, 76, 0.10)',
    navBackgroundColor: '#fff',
    sectionLabelBackgroundColor: '#f8f8f9',
    sectionLabelText: '#a7aab0',
    bodyBackground: '#f8f8f9',
    cardBackground: '#fff',
    cardSeparator: '#f4f4f5',
    cardTitle: '#242c39',

    tabIconDefault: '#bdbfc3',
    tabIconSelected: Platform.OS === 'android' ? '#000' : tintColor,
    tabBar: '#fff',
    noticeText: '#fff',
    greyBackground: '#f8f8f9',
    greyText: '#a7aab0',
    greyUnderlayColor: '#f7f7f7',
    blackText: '#242c39',
    separator: '#f4f4f5',
    refreshControl: undefined,
  },
  dark: {
    absolute: '#000',
    text: '#fff',
    tintColor: darkTintColor,
    darkTintColor: tintColor,
    navBackgroundColor: '#000',
    navBorderBottom: '#000',
    sectionLabelBackgroundColor: '#2a2a2a',
    sectionLabelText: '#fff',
    bodyBackground: '#000',
    cardBackground: '#1c1c1e',
    cardSeparator: '#343437',
    cardTitle: '#fff',
    separator: '#1b1b1b',

    tabBar: '#000',
    tabIconDefault: '#bdbfc3',
    tabIconSelected: Platform.OS === 'android' ? '#fff' : tintColor,
    noticeText: '#fff',
    greyBackground: '#f8f8f9',
    greyText: '#a7aab0',
    greyUnderlayColor: '#f7f7f7',
    blackText: '#242c39',
    refreshControl: '#ffffff',
  },
};
