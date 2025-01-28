import { mergeClasses } from '@expo/styleguide';
import { Star06Icon } from '@expo/styleguide-icons/outline/Star06Icon';

import { formatName, getTagClasses } from '~/ui/components/Tag/helpers';

import { TagProps } from './types';

type StatusTagProps = Omit<TagProps, 'name'> & {
  status: 'deprecated' | 'experimental' | string;
  note?: string;
};

export const StatusTag = ({ status, note, className }: StatusTagProps) => {
  return (
    <div
      className={mergeClasses(
        'mr-2 inline-flex min-h-[21px] select-none items-center gap-1 rounded-full border border-default bg-element px-[7px] py-0.5',
        '[table_&]:mt-0 [table_&]:px-1.5 [table_&]:py-0.5',
        '[h3_&]:last-of-type:mr-0 [h4_&]:last-of-type:mr-0',
        status === 'deprecated' && getTagClasses('deprecated'),
        status === 'experimental' && getTagClasses('experimental'),
        className
      )}>
      {status === 'experimental' && <Star06Icon className="icon-2xs text-palette-pink12" />}
      <span className={mergeClasses('!text-3xs !leading-[16px]')}>
        {status ? formatName(status) + (note ? `: ${note}` : '') : note}
      </span>
    </div>
  );
};
