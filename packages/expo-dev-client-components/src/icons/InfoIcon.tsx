import * as React from 'react';

import { Image } from '../Image';

const icon = require('../../assets/info-icon.png');

export function InfoIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  return <Image source={icon} {...props} />;
}
