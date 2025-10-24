import type {
  NativeStackHeaderLeftProps,
  NativeStackHeaderProps,
  NativeStackHeaderRightProps,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import type { Dispatch, PropsWithChildren, ReactNode, SetStateAction } from 'react';
import type { StyleProp, TextStyle, ImageSourcePropType, ColorValue } from 'react-native';
import type { ScreenStackHeaderConfigProps, SearchBarProps } from 'react-native-screens';

export type StackHeaderTitleProps = {
  children?: string;
  style?: StyleProp<{
    fontFamily?: TextStyle['fontFamily'];
    fontSize?: TextStyle['fontSize'];
    fontWeight?: TextStyle['fontWeight'];
    color?: TextStyle['color'];
    textAlign?: 'left' | 'center';
  }>;
  largeStyle?: StyleProp<{
    fontFamily?: TextStyle['fontFamily'];
    fontSize?: TextStyle['fontSize'];
    fontWeight?: TextStyle['fontWeight'];
    color?: TextStyle['color'];
  }>;
  large?: boolean;
};

export interface StackHeaderProps {
  children?: ReactNode;
  hidden?: boolean;
  asChild?: boolean;
  blurEffect?: ScreenStackHeaderConfigProps['blurEffect'];
  style?: StyleProp<{
    color?: ColorValue; // tintColor from ReactNavigation
    backgroundColor?: ScreenStackHeaderConfigProps['backgroundColor'];
    shadowColor?: undefined | 'transparent';
  }>;
  largeStyle?: StyleProp<{
    backgroundColor?: ScreenStackHeaderConfigProps['largeTitleBackgroundColor'];
    shadowColor?: undefined | 'transparent';
  }>;
}

export interface StackHeaderLeftProps {
  children?: ReactNode;
  asChild?: boolean;
}

export interface StackHeaderRightProps {
  children?: ReactNode;
  asChild?: boolean;
}

export interface StackHeaderSearchBarProps extends SearchBarProps {}

export interface StackHeaderBackButtonProps {
  children?: string;
  style?: NativeStackNavigationOptions['headerBackTitleStyle'];
  withMenu?: boolean;
  displayMode?: ScreenStackHeaderConfigProps['backButtonDisplayMode'];
  hidden?: boolean;
  src?: ImageSourcePropType;
}

interface StackHeaderLeftConfiguration {
  headerLeft?: (props: NativeStackHeaderLeftProps) => React.ReactNode;
}
interface StackHeaderRightConfiguration {
  headerRight?: (props: NativeStackHeaderRightProps) => React.ReactNode;
}
interface StackHeaderBackButtonConfiguration {
  headerBackVisible?: boolean;
  headerBackTitle?: string;
  headerBackTitleStyle?: StyleProp<{
    fontFamily?: string;
    fontSize?: number;
  }>;
  headerBackImageSource?: ImageSourcePropType;
  headerBackButtonMenuEnabled?: boolean;
  headerBackButtonDisplayMode?: ScreenStackHeaderConfigProps['backButtonDisplayMode'];
}
interface StackHeaderTitleConfiguration {
  title?: string;
  headerTitle?: string | ((props: { children: string; tintColor?: string }) => React.ReactNode);
  headerTitleAlign?: 'left' | 'center';
  headerTitleStyle?: StyleProp<
    Pick<TextStyle, 'fontFamily' | 'fontSize' | 'fontWeight'> & {
      color?: string;
    }
  >;
  headerLargeTitle?: boolean;
  headerLargeTitleStyle?: StyleProp<{
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
  }>;
}
interface StackHeaderSearchBarConfiguration {
  headerSearchBarOptions?: SearchBarProps;
}
export interface StackHeaderConfiguration
  extends StackHeaderLeftConfiguration,
    StackHeaderRightConfiguration,
    StackHeaderBackButtonConfiguration,
    StackHeaderTitleConfiguration,
    StackHeaderSearchBarConfiguration {
  title?: string;
  header?: (props: NativeStackHeaderProps) => React.ReactNode;
  headerLargeStyle?: StyleProp<{
    backgroundColor?: string;
  }>;
  headerShown?: boolean;
  headerStyle?: StyleProp<{
    backgroundColor?: string;
  }>;
  headerShadowVisible?: boolean;
  headerTransparent?: boolean;
  headerBlurEffect?: ScreenStackHeaderConfigProps['blurEffect'];
  headerTintColor?: string;
  headerLargeTitleShadowVisible?: boolean;

  headerBackground?: () => React.ReactNode;
}

export interface StackHeaderConfigurationContextValue {
  configuration: StackHeaderConfiguration;
  setHeaderLeftConfiguration: (config: StackHeaderLeftConfiguration) => void;
  setHeaderRightConfiguration: (config: StackHeaderRightConfiguration) => void;
  setHeaderBackButtonConfiguration: (config: StackHeaderBackButtonConfiguration) => void;
  setHeaderTitleConfiguration: (config: StackHeaderTitleConfiguration) => void;
  setHeaderSearchBarConfiguration: (config: StackHeaderSearchBarConfiguration) => void;
}

export interface StackScreensConfigurationContextValue {
  addScreenConfiguration: (name: string, config: StackHeaderConfiguration) => void;
  removeScreenConfiguration: (name: string) => void;
  updateScreenConfiguration: (name: string, config: Partial<StackHeaderConfiguration>) => void;
  setScreenProps: (name: string, props: object) => void;
  removeScreenProps: (name: string) => void;
  addProtectedScreen: (name: string) => void;
  removeProtectedScreen: (name: string) => void;
}

export interface StackScreenConfigurationContextValue {
  configuration: NativeStackNavigationOptions;
  setConfiguration: Dispatch<SetStateAction<NativeStackNavigationOptions>>;
}

export interface StackScreenProps extends PropsWithChildren {
  name?: string;
  options?: NativeStackNavigationOptions;
}
