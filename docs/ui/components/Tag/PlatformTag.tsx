import { mergeClasses } from '@expo/styleguide';

import { TagProps } from './Tag';
import { labelStyle, tagStyle, tagToCStyle } from './styles';

import { PlatformIcon } from '~/components/plugins/PlatformIcon';
import { PlatformName } from '~/types/common';
import { formatName, getPlatformName, TAG_CLASSES } from '~/ui/components/Tag/helpers';

type PlatformTagProps = Omit<TagProps, 'name'> & {
  platform: PlatformName;
};

export const PlatformTag = ({ platform, type, className }: PlatformTagProps) => {
  const platformName = getPlatformName(platform);

  return (
    <div
      css={[tagStyle, type === 'toc' && tagToCStyle]}
      className={mergeClasses(
        (platformName === 'android' ||
          platformName === 'ios' ||
          platformName === 'web' ||
          platformName === 'macos' ||
          platformName === 'tvos') &&
          TAG_CLASSES[platformName],
        'select-none',
        className
      )}>
      {type !== 'toc' && <PlatformIcon platform={platformName} />}
      <span css={labelStyle}>{formatName(platform)}</span>
    </div>
  );
};
