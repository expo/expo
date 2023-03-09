import { StatusSuccessIcon } from '@expo/styleguide-icons';

import { IconBase, DocIconProps } from './IconBase';

export const YesIcon = ({ small }: DocIconProps) => (
  <IconBase Icon={StatusSuccessIcon} className="text-icon-success" small={small} />
);
