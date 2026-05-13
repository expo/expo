import { mergeClasses } from '@expo/styleguide';
import type { ReactNode } from 'react';

import { PlatformName } from '~/types/common';
import { formatName, getPlatformName, getTagClasses } from '~/ui/components/Tag/helpers';

import { PlatformIcon } from './PlatformIcon';
import { TagProps } from './types';

type PlatformTagProps = Omit<TagProps, 'name'> & {
  platform: PlatformName;
  label?: string;
  suffix?: ReactNode;
};

export const PlatformTag = ({ platform, label, className, suffix, ...rest }: PlatformTagProps) => {
  const platformName = getPlatformName(platform);
  const displayLabel = label ?? formatName(platform);

  return (
    <div
      data-md="platform-badge"
      className={mergeClasses(
        'border-default bg-element mr-2 inline-flex min-h-[21px] items-center gap-1 rounded-full border px-[7px] py-0.5 select-none',
        'last:mr-0',
        '[table_&]:mt-0 [table_&]:px-1.5 [table_&]:py-0.5',
        '[h3_&]:last-of-type:mr-0 [h4_&]:last-of-type:mr-0',
        getTagClasses(platformName),
        className
      )}
      {...rest}>
      <PlatformIcon platform={platformName} />
      <span className={mergeClasses('text-xs! leading-none! font-normal whitespace-nowrap')}>
        {displayLabel}
      </span>
      {suffix}
    </div>
  );
};
