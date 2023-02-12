import { scale, View } from 'expo-dev-client-components';
import * as React from 'react';
import { useWindowDimensions } from 'react-native';

export function ScreenContainer({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  return <View style={{ flex: 1, marginHorizontal: width > 650 ? scale[14] : 0 }}>{children}</View>;
}
