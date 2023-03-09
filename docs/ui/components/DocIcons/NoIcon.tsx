import { StatusFailureIcon } from '@expo/styleguide-icons';

import { IconBase, DocIconProps } from './IconBase';

export const NoIcon = ({ small }: DocIconProps) => (
  <IconBase Icon={StatusFailureIcon} className="text-icon-danger" small={small} />
);
