import { StatusBar } from 'react-native';

import { StatusBarAnimation } from './StatusBar.types';

export default function setStatusBarHidden(hidden: boolean, animation: StatusBarAnimation) {
  StatusBar.setHidden(hidden, animation);
}
