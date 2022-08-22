import { TagProps } from './Tag';
import { labelStyle, tagFirstStyle, tagStyle, tagToCStyle } from './styles';

import { PlatformIcon } from '~/components/plugins/PlatformIcon';
import { PlatformName } from '~/types/common';
import { formatName, getPlatformName, getTagStyle } from '~/ui/components/Tag/helpers';

type PlatformTagProps = Omit<TagProps, 'name'> & {
  platform: PlatformName;
};

export const PlatformTag = ({ platform, firstElement, type }: PlatformTagProps) => {
  const platformName = getPlatformName(platform);

  return (
    <div
      css={[
        tagStyle,
        firstElement && tagFirstStyle,
        platformName === 'android' && getTagStyle('green'),
        platformName === 'ios' && getTagStyle('blue'),
        platformName === 'web' && getTagStyle('orange'),
        platformName === 'expo' && getTagStyle('purple'),
        type === 'toc' && tagToCStyle,
      ]}>
      {type !== 'toc' && <PlatformIcon platform={platformName} />}
      <span css={labelStyle}>{formatName(platform)}</span>
    </div>
  );
};
