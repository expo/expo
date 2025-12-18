import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { ImageSourcePropType } from 'react-native';
import type { ScreenStackHeaderConfigProps } from 'react-native-screens';

export interface StackHeaderBackButtonProps {
  children?: string;
  style?: NativeStackNavigationOptions['headerBackTitleStyle'];
  withMenu?: boolean;
  displayMode?: ScreenStackHeaderConfigProps['backButtonDisplayMode'];
  hidden?: boolean;
  src?: ImageSourcePropType;
}

export function StackHeaderBackButton(props: StackHeaderBackButtonProps) {
  return null;
}

export function appendStackHeaderBackButtonPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackHeaderBackButtonProps
): NativeStackNavigationOptions {
  return {
    ...options,
    headerBackTitle: props.children,
    headerBackTitleStyle: props.style,
    headerBackImageSource: props.src,
    headerBackButtonDisplayMode: props.displayMode,
    headerBackButtonMenuEnabled: props.withMenu,
    headerBackVisible: !props.hidden,
  };
}
