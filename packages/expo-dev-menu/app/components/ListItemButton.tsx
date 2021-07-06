import React from 'react';
import { StyleSheet, View } from 'react-native';

import { DevMenuKeyCommand } from '../DevMenuInternal';
import { MaterialCommunityIcon } from '../components/Icon';
import Colors from '../constants/Colors';
import DevMenuKeyCommandLabel from './DevMenuKeyCommandLabel';
import ListItem from './ListItem';
import { StyledText } from './Text';

export type ListItemButtonProps = {
  name: string;
  label: string;
  icon?: string | null;
  keyCommand?: DevMenuKeyCommand | null;
  onPress?: (key: string) => any;
  disabled?: boolean;
};

class ListItemButton extends React.PureComponent<ListItemButtonProps> {
  private onPress = () => {
    this.props.onPress?.(this.props.name);
  };

  renderButtonIcon(icon?: string | null) {
    if (!icon) {
      return null;
    }
    const textColor = this.props.disabled ?? false ? 'disabledTest' : 'menuItemText';
    return (
      <View style={styles.buttonIcon}>
        <MaterialCommunityIcon name={icon} size={22} color={textColor} />
      </View>
    );
  }

  renderLabel(label: string) {
    const textColor = this.props.disabled
      ? {
          lightColor: Colors.light.disabledTest,
          darkColor: Colors.dark.disabledTest,
        }
      : {};

    return (
      <StyledText
        style={styles.label}
        lightColor={Colors.light.menuItemText}
        darkColor={Colors.dark.menuItemText}
        {...textColor}>
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
        <DevMenuKeyCommandLabel {...keyCommand} disabled={this.props.disabled} />
      </View>
    );
  }

  render() {
    const { label, icon, keyCommand, ...other } = this.props;

    return (
      <ListItem {...other} content="" onPress={this.onPress}>
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
