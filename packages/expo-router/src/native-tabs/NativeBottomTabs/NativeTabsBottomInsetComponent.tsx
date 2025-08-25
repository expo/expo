import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  isActive: boolean;
}

const isSupported = process.env.EXPO_OS === 'android';

/**
 * This is not ideal, but seems to work
 *
 * The value is hardcoded based on https://github.com/material-components/material-components-android/blob/master/lib/java/com/google/android/material/bottomnavigation/res/values/dimens.xml#L22
 */
export function NativeTabsBottomInsetComponent({ isActive }: Props) {
  const inset = useSafeAreaInsets();
  if (isSupported && isActive) {
    return <View style={{ height: 56 + inset.bottom, width: '100%', backgroundColor: '#f00' }} />;
  }
  return null;
}
