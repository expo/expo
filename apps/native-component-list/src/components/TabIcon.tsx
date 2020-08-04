import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Platform } from 'react-native';

import { Colors } from '../constants';

interface Props {
  name: string;
  focused?: boolean;
  size?: number;
}

export default class TabIcon extends React.PureComponent<Props> {
  render() {
    const { size = 27, name, focused } = this.props;
    const color = focused ? Colors.tabIconSelected : Colors.tabIconDefault;

    const platformSize = Platform.select({
      ios: size,
      default: size - 2,
    });
    return <MaterialCommunityIcons name={name} size={platformSize} color={color} />;
  }
}
