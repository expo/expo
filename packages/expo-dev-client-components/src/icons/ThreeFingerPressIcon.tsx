import * as React from 'react';

import { Image } from '../Image';

const icon = require('../../assets/three-finger-long-press-icon.png');

export function ThreeFingerPressIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  return <Image source={icon} {...props} />;
}
