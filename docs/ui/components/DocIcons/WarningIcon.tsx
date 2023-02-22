import { WarningIcon as WarningIconComponent, theme } from '@expo/styleguide';

import { IconBase, DocIconProps } from './IconBase';

export const WarningIcon = ({ small }: DocIconProps) => (
  <IconBase Icon={WarningIconComponent} color={theme.icon.warning} small={small} />
);
