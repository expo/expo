import { spacing, lightTheme, ChevronDownIcon, iconSize, CheckIcon } from '@expo/styleguide-native';
import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableOpacityProps,
  TextProps,
} from 'react-native';

type ListRowProps = TouchableOpacityProps & {
  style?: Pick<TouchableOpacityProps, 'style'>;
  labelProps?: TextProps;
  label?: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'transparent' | 'ghost';
  multiSelectActive?: boolean;
  isSelected?: boolean;
};

export function ListRow({
  onPress,
  variant = 'ghost',
  label,
  labelProps,
  style,
  multiSelectActive,
  isSelected,
  ...rest
}: ListRowProps) {
  const backgroundColor = lightTheme.button[variant].background;
  const foregroundColor = lightTheme.button[variant].foreground;

  return (
    <TouchableOpacity
      style={[
        styles.listRowContainer,
        { backgroundColor },
        multiSelectActive && styles.multiSelectActive,
        style,
      ]}
      onPress={onPress}
      {...rest}>
      {Boolean(label) && (
        <Text style={[styles.rowText, { color: foregroundColor }]} {...labelProps}>
          {label}
        </Text>
      )}

      {multiSelectActive ? (
        isSelected ? (
          <CheckIcon size={iconSize.large} color={foregroundColor} />
        ) : (
          <View style={styles.selectableCircle} />
        )
      ) : (
        <ChevronDownIcon
          size={iconSize.large}
          color={foregroundColor}
          style={styles.rotateContainer}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  listRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[4],
    borderColor: lightTheme.border.default,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  multiSelectActive: {},

  selectableCircle: {
    width: iconSize.regular,
    height: iconSize.regular,
    borderRadius: iconSize.regular / 2,
    borderWidth: 2,
    borderColor: lightTheme.border.default,
    marginRight: spacing[1],
  },

  rotateContainer: {
    transform: [
      {
        rotate: '-90deg',
      },
    ],
  },
  rowText: {
    fontSize: 20,
    fontWeight: '600',
  },
});
