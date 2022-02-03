import * as React from 'react';

import { Image } from '../Image';

const icon = require('../../assets/shake-device-icon.png');

export function ShakeDeviceIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  return <Image {...props} source={icon} />;
}
