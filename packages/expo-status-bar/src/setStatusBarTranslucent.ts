import { StatusBar } from 'react-native';

export default function setStatusBarTranslucent(translucent: boolean) {
  StatusBar.setTranslucent(translucent);
}
