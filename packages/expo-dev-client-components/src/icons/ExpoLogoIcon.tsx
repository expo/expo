import * as React from 'react';

import { Image } from '../Image';

const icon = require('../../assets/logo-icon.png');

export function ExpoLogoIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  return <Image {...props} source={icon} />;
}
