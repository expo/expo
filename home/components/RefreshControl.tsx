import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { RefreshControl } from 'react-native';

import Colors from '../constants/Colors';

type Props = React.ComponentProps<typeof RefreshControl>;

export default function StyledRefreshControl(props: Props) {
  const theme = useTheme();
  const color = theme.dark ? Colors.dark.refreshControl : Colors.light.refreshControl;

  return <RefreshControl tintColor={color} {...props} />;
}
