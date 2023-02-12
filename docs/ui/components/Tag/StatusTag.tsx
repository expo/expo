import { TagProps } from './Tag';
import { labelStyle, tagStyle, tagToCStyle } from './styles';

import { formatName, getTagStyle } from '~/ui/components/Tag/helpers';

type StatusTagProps = Omit<TagProps, 'name'> & {
  status: 'deprecated' | 'experimental' | string;
};

export const StatusTag = ({ status, type }: StatusTagProps) => {
  return (
    <div
      css={[
        tagStyle,
        status === 'deprecated' && getTagStyle('yellow'),
        status === 'experimental' && getTagStyle('pink'),
        type === 'toc' && tagToCStyle,
      ]}>
      <span css={labelStyle}>{formatName(status)}</span>
    </div>
  );
};
