import { StatusFailureIcon } from '@expo/styleguide-icons/custom/StatusFailureIcon';

import { IconBase, DocIconProps } from './IconBase';

export const NoIcon = ({ small, ...rest }: DocIconProps) => (
  <IconBase
    Icon={StatusFailureIcon}
    className="text-icon-danger"
    small={small}
    aria-label="No"
    {...rest}
  />
);
