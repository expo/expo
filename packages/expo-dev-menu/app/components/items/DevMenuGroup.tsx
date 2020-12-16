import React from 'react';
import { StyleSheet, PixelRatio, View } from 'react-native';

import { DevMenuItemAnyType, DevMenuItemProps, DevMenuItemEnum } from '../../DevMenuInternal';
import DevMenuItemAction from './DevMenuAction';

type Props = {
  items: DevMenuItemAnyType[];
};

class DevMenuItem extends React.PureComponent<DevMenuItemProps> {
  render() {
    const { item } = this.props;

    switch (item.type) {
      case DevMenuItemEnum.ACTION:
        return <DevMenuItemAction item={item} />;
      case DevMenuItemEnum.GROUP:
        return <DevMenuItemsList items={item.items} />;
      default:
        return null;
    }
  }
}

class DevMenuItemsList extends React.PureComponent<Props> {
  render() {
    const { items } = this.props;

    return (
      <View>
        <View style={styles.group}>
          {items.map((item, index) => (
            <DevMenuItem key={index} item={item} />
          ))}
        </View>
      </View>
    );
  }
}

const pixel = 2 / PixelRatio.get();

const styles = StyleSheet.create({
  group: {
    marginVertical: 7,
    marginHorizontal: -pixel,
  },
});

export default DevMenuItemsList;
