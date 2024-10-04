import * as React from 'react';

import { Image } from '../Image';

const icon = require('../../assets/loading-indicator-icon.png');

export function LoadingIndicatorIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  return <Image source={icon} {...props} />;
}
