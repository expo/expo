import { AlertTriangleSolidIcon } from '@expo/styleguide-icons/solid/AlertTriangleSolidIcon';

import { IconBase, DocIconProps } from './IconBase';

export const WarningIcon = ({ small, ...rest }: DocIconProps) => (
  <IconBase
    Icon={AlertTriangleSolidIcon}
    className="text-icon-warning"
    small={small}
    aria-label="Warning"
    {...rest}
  />
);
