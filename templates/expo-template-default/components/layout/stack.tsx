import { Stack as NativeStack } from 'expo-router';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import * as Device from 'expo-device';

// Perform a quick check for iOS +26
const isLiquidGlass =
  process.env.EXPO_OS === 'ios' && Device.osVersion && !Device.osVersion.startsWith('1');

// These are the default stack options for iOS, they disable on other platforms.
const DEFAULT_STACK_HEADER: NativeStackNavigationOptions =
  process.env.EXPO_OS === 'ios'
    ? {
        headerTransparent: true,
        headerShadowVisible: true,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: {
          backgroundColor: 'transparent',
        },
        headerLargeTitle: true,
        // Toggle styles based on availability of liquid glass effect.
        headerBlurEffect: isLiquidGlass ? 'none' : 'systemChromeMaterial',
        headerBackButtonDisplayMode: isLiquidGlass ? 'minimal' : 'default',
      }
    : {
        // Use defaults for other platforms.
      };

export default function Stack({
  screenOptions,
  ...props
}: React.ComponentProps<typeof NativeStack>) {
  return (
    <NativeStack
      screenOptions={{
        ...DEFAULT_STACK_HEADER,
        ...screenOptions,
      }}
      {...props}
    />
  );
}

Stack.Screen = NativeStack.Screen;
Stack.Protected = NativeStack.Protected;
