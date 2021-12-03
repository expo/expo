import * as React from 'react';

import { Image } from '../Image';

const icon = require('../../assets/user-icon.png');

export function UserIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  return <Image source={icon} {...props} />;
}
