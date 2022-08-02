import { TagProps } from './Tag';
import { labelStyle, tagFirstStyle, tagStyle, tagToCStyle } from './styles';

import { formatName, getTagStyle } from '~/ui/components/Tag/helpers';

type StatusTagProps = Omit<TagProps, 'name'> & {
  status: 'deprecated' | 'experimental' | string;
};

export const StatusTag = ({ status, firstElement, type }: StatusTagProps) => {
  return (
    <div
      css={[
        tagStyle,
        firstElement && tagFirstStyle,
        status === 'deprecated' && getTagStyle('yellow'),
        status === 'experimental' && getTagStyle('pink'),
        type === 'toc' && tagToCStyle,
      ]}>
      <span css={labelStyle}>{formatName(status)}</span>
    </div>
  );
};
