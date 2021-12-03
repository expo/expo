import * as React from 'react';

import { Image } from '../Image';

const icon = require('../../assets/x-icon.png');

export function XIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  return <Image source={icon} {...props} />;
}
