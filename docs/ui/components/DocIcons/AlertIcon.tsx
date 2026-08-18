import { AlertCircleSolidIcon } from '@expo/styleguide-icons/solid/AlertCircleSolidIcon';

import { IconBase, DocIconProps } from './IconBase';

export const AlertIcon = ({ small, ...rest }: DocIconProps) => (
  <IconBase
    Icon={AlertCircleSolidIcon}
    className="text-icon-warning"
    small={small}
    aria-label="Alert"
    {...rest}
  />
);
