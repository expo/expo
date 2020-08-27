import React from 'react';
import { LogBox } from 'react-native';

import ComponentListScreen from '../../ComponentListScreen';
import ReanimatedV2Screens from './ReanimatedV2Screens';
LogBox.ignoreLogs(['Calling `getNode()`']);

const screens = Object.entries(ReanimatedV2Screens).map(([screenName, screen]) => ({
  name: screen.title,
  route: `/components/reanimatedv2/${screenName.toLowerCase()}`,
  isAvailable: true,
}));

export default function ReanimatedV2Screen() {
  return <ComponentListScreen apis={screens} />;
}

ReanimatedV2Screen.navigationOptions = {
  title: 'Reanimated V2',
};
