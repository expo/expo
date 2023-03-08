import { mergeClasses } from '@expo/styleguide';

import { TagProps } from './Tag';
import { labelStyle, tagStyle, tagToCStyle } from './styles';

import { formatName, TAG_CLASSES } from '~/ui/components/Tag/helpers';

type StatusTagProps = Omit<TagProps, 'name'> & {
  status: 'deprecated' | 'experimental' | string;
};

export const StatusTag = ({ status, type }: StatusTagProps) => {
  return (
    <div
      className={mergeClasses(
        status === 'deprecated' && TAG_CLASSES['deprecated'],
        status === 'experimental' && TAG_CLASSES['experimental']
      )}
      css={[tagStyle, type === 'toc' && tagToCStyle]}>
      <span css={labelStyle}>{formatName(status)}</span>
    </div>
  );
};
