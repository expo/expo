import { useTheme } from 'ThemeProvider';
import React, { PropsWithChildren } from 'react';
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

type Props = PropsWithChildren<
  TouchableHighlightProps & {
    loading?: boolean;
    title?: string;
    buttonStyle?: ViewStyle;
  }
>;

const Button = ({
  disabled,
  loading,
  title,
  onPress,
  onPressIn,
  style,
  buttonStyle,
  children,
}: Props) => {
  const { theme } = useTheme();
  const labelColor = disabled ? theme.text.secondary : '#ffffff';

  return (
    <View style={[styles.container, style]}>
      <TouchableHighlight
        style={[
          styles.button,
          disabled && { backgroundColor: theme.background.selected },
          buttonStyle,
        ]}
        disabled={disabled || loading}
        onPressIn={onPressIn}
        onPress={onPress}
        underlayColor={Colors.highlightColor}>
        {children ||
          (loading ? (
            <ActivityIndicator size="small" color={labelColor} />
          ) : (
            <Text style={[styles.label, { color: labelColor }]}>{title}</Text>
          ))}
      </TouchableHighlight>
    </View>
  );
};

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
  label: {
    fontWeight: '700',
  },
});

export default Button;
