import React from 'react';
import {
  PixelRatio,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableHighlightProps,
  View,
} from 'react-native';

import Colors from '../constants/Colors';

type Props = TouchableHighlightProps & {
  title: string;
};

const ListButton = ({ disabled, onPress, style, title }: Props) => {
  const buttonStyles = [styles.button, disabled && styles.disabledButton];
  const labelStyles = [styles.label, disabled && styles.disabledLabel];
  return (
    <TouchableHighlight style={style} disabled={disabled} onPress={onPress} underlayColor="#ddd">
      <View style={buttonStyles}>
        <Text style={labelStyles}>{title}</Text>
      </View>
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    backgroundColor: 'transparent',
    borderBottomWidth: 1.0 / PixelRatio.get(),
    borderBottomColor: '#cccccc',
  },
  disabledButton: {},
  label: {
    color: Colors.tintColor,
    fontWeight: '700',
  },
  disabledLabel: {
    color: '#999999',
  },
});

export default ListButton;
