import { StatusWaitingIcon } from '@expo/styleguide-icons/custom/StatusWaitingIcon';

import { IconBase, DocIconProps } from './IconBase';

export const PendingIcon = ({ small, ...rest }: DocIconProps) => (
  <IconBase
    Icon={StatusWaitingIcon}
    className="text-icon-warning"
    small={small}
    aria-label="Pending"
    {...rest}
  />
);
