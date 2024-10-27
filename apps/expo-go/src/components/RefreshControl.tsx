import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { RefreshControl as RNRefreshControl, Platform } from 'react-native';
import { createNativeWrapper } from 'react-native-gesture-handler';

import Colors from '../constants/Colors';

type Props = React.ComponentProps<typeof RNRefreshControl>;

const RNGHRefreshControl = createNativeWrapper(RNRefreshControl, {
  disallowInterruption: true,
  shouldCancelWhenOutside: false,
});

const RefreshControl = Platform.OS === 'android' ? RNRefreshControl : RNGHRefreshControl;

export default function StyledRefreshControl(props: Props) {
  const theme = useTheme();
  const color = theme.dark ? Colors.dark.refreshControl : Colors.light.refreshControl;

  return <RefreshControl tintColor={color} {...props} />;
}
