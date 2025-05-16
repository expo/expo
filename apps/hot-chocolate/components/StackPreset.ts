import { Stack } from 'expo-router';
import { PlatformColor } from 'react-native';

type StackScreenOptions = React.ComponentProps<typeof Stack>['screenOptions'];

/**
 * A preset for the Stack screen options that uses the system's appearance settings.
 */
export const SystemScreenStackPreset: StackScreenOptions = {
  headerTransparent: true,
  headerBlurEffect: 'systemMaterial',
  headerLargeTitleShadowVisible: false,
  headerLargeStyle: {
    backgroundColor: PlatformColor('systemGroupedBackground') as unknown as string,
  },
};
