import * as React from 'react';

import { Image } from '../Image';
import { useCurrentTheme } from '../useExpoTheme';

const lightIcon = require('../../assets/extensions-icon-light.png');
const icon = require('../../assets/extensions-icon.png');

export function ExtensionsIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  const theme = useCurrentTheme();
  const themedIcon = theme === 'dark' ? lightIcon : icon;

  return <Image source={themedIcon} {...props} />;
}
