import { lightTheme, darkTheme, shadows, iconSize } from '@expo/styleguide-native';
import { View as RNView } from 'react-native';
import { create } from 'react-native-primitives';

import { scale, padding, margin, rounded, bg, bgDark } from './theme';

export const View = create(RNView, {
  variants: {
    overflow: {
      hidden: {
        overflow: 'hidden',
      },
    },

    align: {
      centered: {
        justifyContent: 'center',
        alignItems: 'center',
      },
    },

    flex: {
      '1': { flex: 1 },
      '0': { flex: 0 },
    },

    shrink: {
      '1': { flexShrink: 1 },
      '0': { flexShrink: 0 },
    },

    bg,

    border: {
      default: { borderColor: lightTheme.border.default, borderWidth: 1 },
    },

    ...rounded,

    shadow: {
      micro: shadows.micro,
      tiny: shadows.tiny,
      small: shadows.small,
      medium: shadows.medium,
      button: shadows.button,
    },

    width: {
      micro: { width: iconSize.micro },
      tiny: { width: iconSize.tiny },
      small: { width: iconSize.small },
      medium: { width: iconSize.regular },
      large: { width: iconSize.large },
      xl: { width: scale.xl },
    },

    height: {
      micro: { height: iconSize.micro },
      tiny: { height: iconSize.tiny },
      small: { height: iconSize.small },
      medium: { height: iconSize.regular },
      large: { height: iconSize.large },
      xl: { height: scale.xl },
    },

    ...padding,
    ...margin,
  },

  selectors: {
    dark: {
      bg: bgDark,

      border: {
        default: { borderColor: darkTheme.border.default, borderWidth: 1 },
      },
    },

    light: {
      bg: {},
    },
  },
});

export const Row = create(RNView, {
  base: {
    flexDirection: 'row',
  },

  variants: {
    bg,

    align: {
      center: { alignItems: 'center' },
      start: { alignItems: 'flex-start' },
      end: { alignItems: 'flex-end' },
    },

    ...padding,
    ...margin,
  },

  selectors: {
    dark: {
      bg: bgDark,
    },
  },
});

const Horizontal = create(RNView, {
  variants: {
    size: {
      flex: { flex: 1 },
      micro: { width: scale.micro },
      tiny: { width: scale.tiny },
      small: { width: scale.small },
      medium: { width: scale.medium },
      large: { width: scale.large },
      xl: { width: scale.xl },
    },
  },
});

const Vertical = create(RNView, {
  variants: {
    size: {
      flex: { flex: 1 },
      micro: { height: scale.micro },
      tiny: { height: scale.tiny },
      small: { height: scale.small },
      medium: { height: scale.medium },
      large: { height: scale.large },
      xl: { height: scale.xl },
    },
  },
});

export const Spacer = {
  Vertical,
  Horizontal,
};

export const Divider = create(RNView, {
  base: {
    borderWidth: 0.5,
    borderColor: lightTheme.border.default,
  },

  variants: {
    weight: {
      thin: { borderWidth: 0.5 },
      normal: { borderWidth: 1 },
      heavy: { borderWidth: 2 },
    },

    ...margin,
  },

  selectors: {
    dark: {
      borderColor: darkTheme.border.default,
    },
  },
});

export const StatusIndicator = create(RNView, {
  base: {
    backgroundColor: lightTheme.status.default,
    borderRadius: 9999,
  },

  variants: {
    status: {
      info: { backgroundColor: lightTheme.status.info },
      success: { backgroundColor: lightTheme.status.success },
      warning: { backgroundColor: lightTheme.status.warning },
      error: { backgroundColor: lightTheme.status.error },
      default: { backgroundColor: lightTheme.status.default },
    },

    size: {
      small: {
        width: scale.small,
        height: scale.small,
      },
      medium: {
        width: scale.medium,
        height: scale.medium,
      },
    },
  },

  selectors: {
    dark: {
      info: { backgroundColor: darkTheme.status.info },
      success: { backgroundColor: darkTheme.status.success },
      warning: { backgroundColor: darkTheme.status.warning },
      error: { backgroundColor: darkTheme.status.error },
      default: { backgroundColor: darkTheme.status.default },
    },
  },
});
