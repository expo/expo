import { TagProps } from './Tag';
import { labelStyle, tagStyle, tagToCStyle } from './styles';

import { PlatformIcon } from '~/components/plugins/PlatformIcon';
import { PlatformName } from '~/types/common';
import { formatName, getPlatformName, getTagStyle } from '~/ui/components/Tag/helpers';

type PlatformTagProps = Omit<TagProps, 'name'> & {
  platform: PlatformName;
};

export const PlatformTag = ({ platform, type }: PlatformTagProps) => {
  const platformName = getPlatformName(platform);

  return (
    <div
      css={[
        tagStyle,
        platformName === 'android' && getTagStyle(platformName),
        platformName === 'ios' && getTagStyle(platformName),
        platformName === 'web' && getTagStyle(platformName),
        platformName === 'expo' && getTagStyle(platformName),
        type === 'toc' && tagToCStyle,
      ]}>
      {type !== 'toc' && <PlatformIcon platform={platformName} />}
      <span css={labelStyle}>{formatName(platform)}</span>
    </div>
  );
};
