import { getPlatformName } from '~/ui/components/Tag/helpers';

import { PlatformTag } from './PlatformTag';
import { StatusTag } from './StatusTag';
import { TagProps } from './types';

export const Tag = ({ name, ...rest }: TagProps) => {
  if (getPlatformName(name).length) {
    return <PlatformTag platform={name} {...rest} />;
  } else {
    return <StatusTag status={name} {...rest} />;
  }
};
