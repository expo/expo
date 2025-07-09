import { AlertTriangleSolidIcon } from '@expo/styleguide-icons/solid/AlertTriangleSolidIcon';

import { IconBase, DocIconProps } from './IconBase';

export const WarningIcon = ({ small }: DocIconProps) => (
  <IconBase Icon={AlertTriangleSolidIcon} className="text-icon-warning" small={small} />
);
