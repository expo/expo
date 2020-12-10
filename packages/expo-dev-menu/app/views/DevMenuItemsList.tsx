import { NavigationContext } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, PixelRatio, View } from 'react-native';

import DevMenuContext from '../DevMenuContext';
import {
  DevMenuItemAnyType,
  DevMenuItemEnum,
  DevMenuItemActionType,
  dispatchActionAsync,
} from '../DevMenuInternal';
import ListItemButton from '../components/ListItemButton';
import Colors from '../constants/Colors';
import { StyledText } from '../components/Text';

type Props = {
  items: DevMenuItemAnyType[];
};

type ItemProps<ItemType = DevMenuItemAnyType> = {
  item: ItemType;
};

class DevMenuItem extends React.PureComponent<ItemProps> {
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

class DevMenuItemAction extends React.PureComponent<ItemProps<DevMenuItemActionType>> {
  static contextType = DevMenuContext;

  action = (...args) => {
    dispatchActionAsync(...args);
    this.context?.collapse?.();
  };

  render() {
    const { actionId, label, glyphName, keyCommand } = this.props.item;

    return (
      <ListItemButton
        name={actionId}
        label={label}
        icon={glyphName}
        keyCommand={keyCommand}
        onPress={this.action}
      />
    );
  }
}

class DevMenuItemNavigation extends React.PureComponent<{
  route: string;
  label: string;
  glyphName: string;
}> {
  static contextType = NavigationContext;

  action = () => {
    this.context.push(this.props.route);
  };

  render() {
    const { route, label, glyphName } = this.props;
    return <ListItemButton name={route} label={label} onPress={this.action} icon={glyphName} />;
  }
}

export default class DevMenuItemsList extends React.PureComponent<Props> {
  render() {
    const { items } = this.props;

    return (
      <View>
        <View style={styles.group}>
          {items.map((item, index) => (
            <DevMenuItem key={index} item={item} />
          ))}
        </View>
        <View style={styles.group}>
          <DevMenuItemNavigation route="Settings" label="Settings" glyphName="settings-outline" />
          <DevMenuItemNavigation
            route="Test"
            label="Navigation and scroll test"
            glyphName="test-tube"
          />
        </View>
        <DevMenuItemsListFooter label="This development menu will not be present in any release builds of this project." />
      </View>
    );
  }
}

function DevMenuItemsListFooter(props: { label: string }) {
  return (
    <View style={styles.footer}>
      <StyledText
        style={styles.footerText}
        lightColor={Colors.light.grayText}
        darkColor={Colors.dark.grayText}>
        {props.label}
      </StyledText>
    </View>
  );
}

const pixel = 2 / PixelRatio.get();

const styles = StyleSheet.create({
  group: {
    marginVertical: 7,
    marginHorizontal: -pixel,
  },
  footer: {
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
  },
});
