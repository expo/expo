import * as React from 'react';

import { Image } from '../Image';
import { useCurrentTheme } from '../useExpoTheme';

const lightIcon = require('../../assets/shake-device-icon-light.png');
const icon = require('../../assets/shake-device-icon.png');

export function ShakeDeviceIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  const theme = useCurrentTheme();
  const themedIcon = theme === 'dark' ? lightIcon : icon;

  return <Image source={themedIcon} {...props} />;
}
