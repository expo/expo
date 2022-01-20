import * as React from 'react';

import { Image } from '../Image';

const icon = require('../../assets/debug-icon.png');

export function DebugIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  return <Image source={icon} {...props} />;
}
