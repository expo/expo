import { StatusBar } from 'react-native';

export default function setStatusBarBackgroundColor(backgroundColor: string, animated: boolean) {
  StatusBar.setBackgroundColor(backgroundColor, animated);
}
