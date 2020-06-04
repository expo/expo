import { StatusBarProps, StatusBarPropsAndroid, StatusBarPropsIOS, StatusBarAnimation, StatusBarStyle } from 'react-native';
import StatusBar from './ExpoStatusBar';
declare const setBackgroundColor: (color: string, animated?: boolean | undefined) => void;
declare const setBarStyle: (style: StatusBarStyle, animated?: boolean | undefined) => void;
declare const setHidden: (hidden: boolean, animation?: "fade" | "slide" | "none" | undefined) => void;
declare const setNetworkActivityIndicatorVisible: (visible: boolean) => void;
declare const setTranslucent: (translucent: boolean) => void;
export { StatusBar, StatusBarProps, StatusBarPropsAndroid, StatusBarPropsIOS, StatusBarAnimation, StatusBarStyle, setBarStyle, setBackgroundColor, setHidden, setNetworkActivityIndicatorVisible, setTranslucent, };
