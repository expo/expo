import { StatusBar } from 'react-native';

import { StatusBarStyle } from './StatusBar.types';
import styleToBarStyle from './styleToBarStyle';

export default function setStatusBarStyle(style: StatusBarStyle) {
  StatusBar.setBarStyle(styleToBarStyle(style));
}
