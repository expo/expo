import { mergeClasses } from '@expo/styleguide';
import { Star06Icon } from '@expo/styleguide-icons/outline/Star06Icon';

import { TagProps } from './Tag';
import { labelStyle, tagStyle } from './styles';

import { formatName, getTagClasses } from '~/ui/components/Tag/helpers';

type StatusTagProps = Omit<TagProps, 'name'> & {
  status: 'deprecated' | 'experimental' | string;
  note?: string;
};

export const StatusTag = ({ status, note, className }: StatusTagProps) => {
  return (
    <div
      className={mergeClasses(
        status === 'deprecated' && getTagClasses('deprecated'),
        status === 'experimental' && getTagClasses('experimental'),
        'select-none',
        className
      )}
      css={tagStyle}>
      {status === 'experimental' && <Star06Icon className="icon-xs text-palette-pink12" />}
      <span css={labelStyle}>{status ? formatName(status) + (note ? `: ${note}` : '') : note}</span>
    </div>
  );
};
