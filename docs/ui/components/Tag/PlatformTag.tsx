import { mergeClasses } from '@expo/styleguide';

import { PlatformIcon } from './PlatformIcon';
import { TagProps } from './Tag';
import { labelStyle, tagStyle } from './styles';

import { PlatformName } from '~/types/common';
import { formatName, getPlatformName, getTagClasses } from '~/ui/components/Tag/helpers';

type PlatformTagProps = Omit<TagProps, 'name'> & {
  platform: PlatformName;
};

export const PlatformTag = ({ platform, className }: PlatformTagProps) => {
  const platformName = getPlatformName(platform);

  return (
    <div
      css={tagStyle}
      className={mergeClasses(getTagClasses(platformName), 'select-none', className)}>
      <PlatformIcon platform={platformName} />
      <span css={labelStyle}>{formatName(platform)}</span>
    </div>
  );
};
