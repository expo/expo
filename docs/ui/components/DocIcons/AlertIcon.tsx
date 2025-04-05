import { AlertCircleSolidIcon } from '@expo/styleguide-icons/solid/AlertCircleSolidIcon';

import { IconBase, DocIconProps } from './IconBase';

export const AlertIcon = ({ small }: DocIconProps) => (
  <IconBase Icon={AlertCircleSolidIcon} className="text-icon-warning" small={small} />
);
