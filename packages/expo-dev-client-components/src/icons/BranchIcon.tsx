import * as React from 'react';

import { Image } from '../Image';
import { useCurrentTheme } from '../useExpoTheme';

const lightIcon = require('../../assets/branch-icon-light.png');
const icon = require('../../assets/branch-icon.png');

export function BranchIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  const theme = useCurrentTheme();
  const themedIcon = theme === 'dark' ? lightIcon : icon;

  return <Image source={themedIcon} {...props} />;
}
