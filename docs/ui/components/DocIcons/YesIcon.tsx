import { StatusSuccessIcon, theme } from '@expo/styleguide';

import { IconBase, DocIconProps } from './IconBase';

export const YesIcon = ({ small }: DocIconProps) => (
  <IconBase Icon={StatusSuccessIcon} color={theme.icon.success} small={small} />
);
