import * as React from 'react';

import { Image } from '../Image';
import { useCurrentTheme } from '../useExpoTheme';

const lightIcon = require('../../assets/update-icon-light.png');
const icon = require('../../assets/update-icon.png');

export function UpdateIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  const theme = useCurrentTheme();
  const themedIcon = theme === 'dark' ? lightIcon : icon;

  return <Image source={themedIcon} {...props} />;
}
