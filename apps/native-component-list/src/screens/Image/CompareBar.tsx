import { MaterialIcons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';

import Colors from '../../constants/Colors';

type PropsType = {
  collapsed: boolean;
  ImageComponent: React.ComponentType<any>;
  onPress: (collapsed: boolean) => any;
  onPressComponent: (ImageComponent: React.ComponentType<any>) => any;
};

export default class CompareBar extends React.Component<PropsType> {
  render() {
    const { collapsed, ImageComponent } = this.props;
    const name = ImageComponent.displayName || ImageComponent.name || 'Component';
    return (
      <TouchableOpacity
        style={[styles.container, collapsed ? styles.collapsed : undefined]}
        activeOpacity={0.5}
        onPress={this.onPress}>
        <View style={styles.row}>
          <Text style={styles.heading}>Compare to:</Text>
          <TouchableOpacity onPress={this.onPressComponent}>
            <Text style={styles.component}>{`<${name}>`}</Text>
          </TouchableOpacity>
        </View>
        <MaterialIcons name={collapsed ? 'keyboard-arrow-down' : 'keyboard-arrow-up'} size={25} />
      </TouchableOpacity>
    );
  }

  onPress = () => {
    const { collapsed, onPress } = this.props;
    if (onPress) onPress(!collapsed);
  };

  onPressComponent = () => {
    const { ImageComponent, onPressComponent } = this.props;
    if (onPressComponent) onPressComponent(ImageComponent);
  };
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  component: {
    color: Colors.highlightColor,
    fontWeight: 'bold',
    fontSize: 18,
    marginHorizontal: 10,
    marginVertical: 4,
  },
  collapsed: {
    borderBottomWidth: 0,
  },
});
