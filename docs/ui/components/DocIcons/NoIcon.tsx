import { StatusFailedIcon, theme } from '@expo/styleguide';
import * as React from 'react';

import { IconBase, DocIconProps } from './IconBase';

export const NoIcon = ({ small }: DocIconProps) => (
  <IconBase Icon={StatusFailedIcon} color={theme.status.error} small={small} />
);
