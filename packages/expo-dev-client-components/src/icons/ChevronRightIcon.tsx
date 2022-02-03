import * as React from 'react';

import { Image } from '../Image';

const icon = require('../../assets/chevron-right-icon.png');

export function ChevronRightIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  return <Image source={icon} {...props} />;
}
