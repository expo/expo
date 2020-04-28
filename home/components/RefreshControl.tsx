import * as React from 'react';
import { RefreshControl } from 'react-native';
import { useTheme } from 'react-navigation';

import Colors from '../constants/Colors';

type Props = React.ComponentProps<typeof RefreshControl>;

export default function StyledRefreshControl(props: Props) {
  const theme = useTheme();
  const color = Colors[theme].refreshControl;

  return <RefreshControl tintColor={color} {...props} />;
}
