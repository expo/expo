import { Appearance, ColorSchemeName } from 'react-native';

import { StatusBarStyle } from './StatusBar.types';

function getColorScheme() {
  if (Appearance) {
    return Appearance.getColorScheme();
  } else {
    return 'light';
  }
}

export default function styleToBarStyle(
  style: StatusBarStyle = 'auto',
  colorScheme: ColorSchemeName = getColorScheme()
): 'light-content' | 'dark-content' {
  if (!colorScheme) {
    colorScheme = 'light';
  }

  let resolvedStyle = style;
  if (style === 'auto') {
    resolvedStyle = colorScheme === 'light' ? 'dark' : 'light';
  } else if (style === 'inverted') {
    resolvedStyle = colorScheme === 'light' ? 'light' : 'dark';
  }

  return resolvedStyle === 'light' ? 'light-content' : 'dark-content';
}
