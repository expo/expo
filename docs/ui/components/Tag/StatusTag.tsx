import { mergeClasses } from '@expo/styleguide';
import { Stars02Icon } from '@expo/styleguide-icons';

import { TagProps } from './Tag';
import { labelStyle, tagStyle, tagToCStyle } from './styles';

import { formatName, TAG_CLASSES } from '~/ui/components/Tag/helpers';

type StatusTagProps = Omit<TagProps, 'name'> & {
  status: 'deprecated' | 'experimental' | string;
  note?: string;
};

export const StatusTag = ({ status, type, note }: StatusTagProps) => {
  return (
    <div
      className={mergeClasses(
        status === 'deprecated' && TAG_CLASSES['deprecated'],
        status === 'experimental' && TAG_CLASSES['experimental']
      )}
      css={[tagStyle, type === 'toc' && tagToCStyle]}>
      {status === 'experimental' && <Stars02Icon className="icon-xs text-palette-pink11" />}
      <span css={labelStyle}>
        {formatName(status)}
        {note && `: ${note}`}
      </span>
    </div>
  );
};
