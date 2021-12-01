import * as React from 'react';

import { Image } from '../Image';

const icon = require('../../assets/show-menu-at-launch-icon.png');

export function ShowMenuIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  return <Image source={icon} {...props} />;
}
