import { StatusSuccessIcon } from '@expo/styleguide-icons/custom/StatusSuccessIcon';

import { IconBase, DocIconProps } from './IconBase';

export const YesIcon = ({ small, ...rest }: DocIconProps) => (
  <IconBase
    Icon={StatusSuccessIcon}
    className="text-icon-success"
    small={small}
    aria-label="Yes"
    {...rest}
  />
);
