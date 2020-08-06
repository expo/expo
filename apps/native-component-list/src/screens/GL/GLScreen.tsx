import * as React from 'react';

import ComponentListScreen from '../ComponentListScreen';
import GLScreens from './GLScreens';

const screens = Object.keys(GLScreens).map(name => ({
  name: GLScreens[name].screen.title ?? name,
  route: `/components/gl/${name.toLowerCase()}`,
  isAvailable: true,
}));
export default function GLScreen() {
  return <ComponentListScreen apis={screens} />;
}

GLScreen.navigationOptions = {
  title: 'Examples of GL use',
};
