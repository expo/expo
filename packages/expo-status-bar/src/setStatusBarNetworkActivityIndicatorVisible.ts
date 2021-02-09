import { StatusBar } from 'react-native';

export default function setStatusBarNetworkActivityIndicatorVisible(visible: boolean) {
  StatusBar.setNetworkActivityIndicatorVisible(visible);
}
