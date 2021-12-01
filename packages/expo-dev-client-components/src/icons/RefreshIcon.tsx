import * as React from 'react';

import { Image } from '../Image';

const icon = require('../../assets/refresh-icon.png');

export function RefreshIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  return <Image source={icon} {...props} />;
}
