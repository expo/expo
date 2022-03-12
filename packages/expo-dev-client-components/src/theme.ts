import { spacing, lightTheme, darkTheme, borderRadius } from '@expo/styleguide-native';
import { TextStyle, Platform } from 'react-native';

type SpacingKey = `${keyof typeof spacing}`;
type DescriptiveScale = 'micro' | 'tiny' | 'small' | 'medium' | 'large' | 'xl';
type Scale = Record<SpacingKey | DescriptiveScale, number>;

export const scale: Scale = {
  micro: spacing[0.5],
  tiny: spacing[1],
  small: spacing[3],
  medium: spacing[4],
  large: spacing[6],
  xl: spacing[8],
  ...spacing,
};

function fullSpacingScaleForAttributes(attributes: string[]) {
  const obj = {};

  Object.keys(scale).forEach((key) => {
    key = `${key}`;
    const value = {};

    attributes.forEach((attribute) => {
      value[attribute] = scale[key];
    });

    obj[key] = value;
  });

  return obj as Record<SpacingKey | DescriptiveScale, any>;
}

export const padding = {
  padding: fullSpacingScaleForAttributes(['padding']),
  px: fullSpacingScaleForAttributes(['paddingHorizontal']),
  py: fullSpacingScaleForAttributes(['paddingVertical']),
  pb: fullSpacingScaleForAttributes(['paddingBottom']),
  pt: fullSpacingScaleForAttributes(['paddingTop']),
};

export const margin = {
  margin: fullSpacingScaleForAttributes(['margin']),
  mx: fullSpacingScaleForAttributes(['marginHorizontal']),
  my: fullSpacingScaleForAttributes(['marginVertical']),
  mb: fullSpacingScaleForAttributes(['marginBottom']),
  mt: fullSpacingScaleForAttributes(['marginTop']),
};

export const width = fullSpacingScaleForAttributes(['width']);
export const height = fullSpacingScaleForAttributes(['height']);

export const rounded = {
  rounded: {
    none: { borderRadius: 0 },
    small: { borderRadius: borderRadius.small },
    medium: { borderRadius: borderRadius.medium },
    large: { borderRadius: borderRadius.large },
    full: { borderRadius: 99999 },
  },

  roundedTop: {
    none: { borderTopLeftRadius: 0, borderTopRightRadius: 0 },
    small: { borderTopLeftRadius: borderRadius.small, borderTopRightRadius: borderRadius.small },
    medium: {
      borderTopLeftRadius: borderRadius.medium,
      borderTopRightRadius: borderRadius.medium,
    },
    large: { borderTopLeftRadius: borderRadius.large, borderTopRightRadius: borderRadius.large },
    full: { borderTopLeftRadius: 9999, borderTopRightRadius: 9999 },
  },

  roundedBottom: {
    none: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
    small: {
      borderBottomLeftRadius: borderRadius.small,
      borderBottomRightRadius: borderRadius.small,
    },
    medium: {
      borderBottomLeftRadius: borderRadius.medium,
      borderBottomRightRadius: borderRadius.medium,
    },
    large: {
      borderBottomLeftRadius: borderRadius.large,
      borderBottomRightRadius: borderRadius.large,
    },
    full: { borderBottomLeftRadius: 9999, borderBottomRightRadius: 9999 },
  },
};

export const text = {
  align: {
    center: { textAlign: 'center' as TextStyle['textAlign'] },
  },

  size: {
    small: {
      fontSize: 12,
      lineHeight: 14,
    },
    medium: {
      fontSize: 16,
      lineHeight: 18,
    },
    large: {
      fontSize: 18,
      lineHeight: 24,
    },
  },

  leading: {
    large: { lineHeight: 18 },
  },

  type: {
    mono: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
  },

  weight: {
    thin: { fontWeight: '100' as TextStyle['fontWeight'] },
    extralight: { fontWeight: '200' as TextStyle['fontWeight'] },
    light: { fontWeight: '300' as TextStyle['fontWeight'] },
    normal: { fontWeight: '400' as TextStyle['fontWeight'] },
    medium: { fontWeight: '500' as TextStyle['fontWeight'] },
    semibold: { fontWeight: '600' as TextStyle['fontWeight'] },
    bold: { fontWeight: '700' as TextStyle['fontWeight'] },
    extrabold: { fontWeight: '800' as TextStyle['fontWeight'] },
    black: { fontWeight: '900' as TextStyle['fontWeight'] },
  },

  color: {
    default: { color: lightTheme.text.default },
    error: { color: lightTheme.text.error },
    warning: { color: lightTheme.text.warning },
    success: { color: lightTheme.text.success },
    secondary: { color: lightTheme.text.secondary },
    primary: { color: lightTheme.button.primary.background },
    link: { color: lightTheme.link.default },
  },
};

export const textDark = {
  base: {
    color: darkTheme.text.default,
  },

  color: {
    default: { color: darkTheme.text.default },
    error: { color: darkTheme.text.error },
    warning: { color: darkTheme.text.warning },
    success: { color: darkTheme.text.success },
    secondary: { color: darkTheme.text.secondary },
    primary: { color: darkTheme.button.primary.background },
    link: { color: darkTheme.link.default },
  },
};

export const bg = {
  none: { backgroundColor: 'transparent' },
  default: { backgroundColor: lightTheme.background.default },
  secondary: { backgroundColor: lightTheme.background.secondary },
  overlay: { backgroundColor: lightTheme.background.overlay },
  success: { backgroundColor: lightTheme.background.success },
  warning: { backgroundColor: lightTheme.background.warning },
  error: { backgroundColor: lightTheme.background.error },
};

export const bgDark = {
  default: { backgroundColor: darkTheme.background.secondary },
  secondary: { backgroundColor: darkTheme.background.default },
  overlay: { backgroundColor: darkTheme.background.overlay },
  success: { backgroundColor: darkTheme.background.success },
  warning: { backgroundColor: darkTheme.background.warning },
  error: { backgroundColor: darkTheme.background.error },
};

type NavigationTheme = {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
  };
};

export const lightNavigationTheme: NavigationTheme = {
  dark: false,
  colors: {
    primary: lightTheme.button.primary.background,
    background: lightTheme.background.secondary,
    card: lightTheme.background.default,
    text: lightTheme.text.default,
    border: lightTheme.border.default,
    notification: lightTheme.highlight.accent,
  },
};

export const darkNavigationTheme: NavigationTheme = {
  dark: true,
  colors: {
    primary: darkTheme.link.default,
    background: darkTheme.background.default,
    card: darkTheme.background.default,
    text: darkTheme.text.default,
    border: darkTheme.border.default,
    notification: darkTheme.highlight.accent,
  },
};
