import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Platform } from 'react-native';

import { Colors } from '../constants';

class TabIcon extends React.PureComponent {
  render() {
    const { size = 27, name, focused } = this.props;
    const color = focused ? Colors.tabIconSelected : Colors.tabIconDefault;

    const platformSize = Platform.select({
      ios: size,
      default: size - 2,
    });
    return <Icon name={name} size={platformSize} color={color} />;
  }
}

export default TabIcon;
