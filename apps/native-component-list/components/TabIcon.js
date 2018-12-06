import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Platform } from 'react-native';

import { Colors } from '../constants';

class TabIcon extends React.PureComponent {
  render() {
    const { size = 27, name, focused } = this.props;
    const color = focused ? Colors.tabIconSelected : Colors.tabIconDefault;
    return (
      <MaterialIcons name={name} size={Platform.OS === 'android' ? size - 2 : size} color={color} />
    );
  }
}

export default TabIcon;
