import { MaterialIcons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';

import Colors from '../../constants/Colors';

type PropsType = {
  collapsed: boolean;
  onPress: (collapsed: boolean) => any;
};

export default class CompareBar extends React.Component<PropsType> {
  render() {
    const { collapsed } = this.props;
    return (
      <TouchableOpacity
        style={[styles.container, collapsed ? styles.collapsed : undefined]}
        activeOpacity={0.5}
        onPress={this.onPress}>
        <Text style={styles.heading}>{'Compare to <Image>'}</Text>
        <MaterialIcons name={collapsed ? 'keyboard-arrow-down' : 'keyboard-arrow-up'} size={25} />
      </TouchableOpacity>
    );
  }

  onPress = () => {
    const { collapsed, onPress } = this.props;
    if (onPress) onPress(!collapsed);
  };
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  collapsed: {
    borderBottomWidth: 0,
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});
