import type { ColorValue } from 'react-native';

/**
 * Colors for an `IconButton`'s container. Returns `{}` when unset, since Expo UI
 * doesn't reset a prop that becomes `undefined`.
 */
export function getIconButtonContainerColors(buttonContainerColor: ColorValue | undefined): {
  containerColor?: ColorValue;
  disabledContainerColor?: ColorValue;
} {
  return buttonContainerColor
    ? { containerColor: buttonContainerColor, disabledContainerColor: buttonContainerColor }
    : {};
}
