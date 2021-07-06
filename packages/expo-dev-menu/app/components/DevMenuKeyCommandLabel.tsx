import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

import { DevMenuKeyCommandsEnum, doesDeviceSupportKeyCommands } from '../DevMenuInternal';
import Colors from '../constants/Colors';
import { StyledText } from './Text';

type Props = {
  input: string;
  modifiers: DevMenuKeyCommandsEnum;
  disabled?: boolean;
};

function keyCommandToString(input: string, modifiers: DevMenuKeyCommandsEnum): string {
  const chars: string[] = [];
  if (modifiers & DevMenuKeyCommandsEnum.CONTROL) {
    chars.push('⌃');
  }
  if (modifiers & DevMenuKeyCommandsEnum.ALT) {
    chars.push('⌥');
  }
  if (modifiers & DevMenuKeyCommandsEnum.SHIFT) {
    chars.push('⇧');
  }
  if (modifiers & DevMenuKeyCommandsEnum.COMMAND) {
    chars.push('⌘');
  }
  chars.push(input.toUpperCase());
  return chars.join('');
}

export default class DevMenuKeyCommandLabel extends React.PureComponent<Props> {
  render() {
    if (!doesDeviceSupportKeyCommands) {
      return <View />;
    }
    const { input, modifiers } = this.props;
    const label = keyCommandToString(input, modifiers);
    const textColor = this.props.disabled
      ? {
          lightColor: Colors.light.disabledTest,
          darkColor: Colors.dark.disabledTest,
        }
      : {};
    const characters = label.split('').map(symbol => (
      <StyledText key={symbol} style={styles.character} {...textColor}>
        {symbol}
      </StyledText>
    ));

    return <View style={styles.container}>{characters}</View>;
  }
}

const CHARACTER_WIDTH = 14;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  character: {
    width: CHARACTER_WIDTH,
    fontSize: CHARACTER_WIDTH,
    textAlign: 'center',
    fontFamily: Platform.select({
      android: 'monospace',
      ios: 'Courier',
    }),
  },
});
