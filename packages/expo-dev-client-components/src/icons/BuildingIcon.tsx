import * as React from 'react';

import { Image } from '../Image';

const icon = require('../../assets/building-icon.png');

export function BuildingIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  return <Image source={icon} {...props} />;
}
