import * as React from 'react';

import { Image } from '../Image';

const icon = require('../../assets/run-icon.png');

export function RunIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  return <Image source={icon} {...props} />;
}
