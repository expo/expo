import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ListItem from './ListItem';
import { StyledText } from './Text';
import { StyledIcon } from './Views';
import { DevMenuKeyCommand } from '../DevMenuInternal';
import DevMenuKeyCommandLabel from './DevMenuKeyCommandLabel';
import Colors from '../constants/Colors';

export type ListItemButtonProps = {
  name: string;
  label: string;
  icon?: string | null;
  keyCommand?: DevMenuKeyCommand | null;
  onPress?: (key: string) => any;
};

class ListItemButton extends React.PureComponent<ListItemButtonProps> {
  private onPress = () => {
    this.props.onPress?.(this.props.name);
  };

  renderButtonIcon(icon?: string | null) {
    if (!icon) {
      return null;
    }
    return (
      <View style={styles.buttonIcon}>
        <StyledIcon component={MaterialCommunityIcons} name={icon} size={22} color="menuItemText" />
      </View>
    );
  }

  renderLabel(label: string) {
    return (
      <StyledText
        style={styles.label}
        lightColor={Colors.light.menuItemText}
        darkColor={Colors.dark.menuItemText}>
        {label}
      </StyledText>
    );
  }

  renderKeyCommand(keyCommand?: DevMenuKeyCommand) {
    if (!keyCommand) {
      return null;
    }
    return (
      <View style={styles.keyCommand}>
        <DevMenuKeyCommandLabel {...keyCommand} />
      </View>
    );
  }

  render() {
    const { label, icon, keyCommand, ...other } = this.props;

    return (
      <ListItem {...other} title="" onPress={this.onPress}>
        {this.renderButtonIcon(icon)}
        {this.renderLabel(label)}
        {this.renderKeyCommand(keyCommand)}
      </ListItem>
    );
  }
}

const styles = StyleSheet.create({
  buttonIcon: {
    marginHorizontal: 5,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginHorizontal: 5,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    fontSize: 16,
  },
  keyCommand: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
});

export default ListItemButton;
