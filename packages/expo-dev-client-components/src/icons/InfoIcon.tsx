import * as React from 'react';

import { Image } from '../Image';
import { useCurrentTheme } from '../useExpoTheme';

const lightIcon = require('../../assets/info-icon-light.png');
const icon = require('../../assets/info-icon.png');

export function InfoIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  const theme = useCurrentTheme();
  const themedIcon = theme === 'dark' ? lightIcon : icon;

  return <Image source={themedIcon} {...props} />;
}
