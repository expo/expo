import { View, type ViewProps } from 'react-native';

/**
 * A bridging container that hosts SwiftUI views on iOS and Jetpack Compose views on Android.
 */
export function Host({
  children,
  style,
  ...rest
}: ViewProps & {
  matchContents?: boolean | { vertical?: boolean; horizontal?: boolean };
}) {
  return (
    <View style={style} {...rest}>
      {children}
    </View>
  );
}
