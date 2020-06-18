import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableHighlightProps,
  View,
  ViewStyle,
} from 'react-native';

import Colors from '../constants/Colors';

interface Props extends TouchableHighlightProps {
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  buttonStyle?: ViewStyle;
}

const Button: React.FunctionComponent<Props> = ({
  disabled,
  loading,
  title,
  onPress,
  onPressIn,
  style,
  buttonStyle,
  children,
}) => (
  <View style={[styles.container, style]}>
    <TouchableHighlight
      style={[styles.button, disabled && styles.disabledButton, buttonStyle]}
      disabled={disabled || loading}
      onPressIn={onPressIn}
      onPress={onPress}
      underlayColor={Colors.highlightColor}>
      {children ||
        (loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.label}>{title}</Text>
        ))}
    </TouchableHighlight>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.tintColor,
  },
  disabledButton: {
    backgroundColor: Colors.disabled,
  },
  label: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

export default Button;
