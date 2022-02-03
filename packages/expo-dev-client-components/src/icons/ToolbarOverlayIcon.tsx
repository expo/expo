import * as React from 'react';

import { Image } from '../Image';

const icon = require('../../assets/toolbar-overlay-icon.png');

export function ToolbarOverlayIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  return <Image source={icon} {...props} />;
}
