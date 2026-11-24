import { mergeClasses } from '@expo/styleguide';
import type { ReactNode } from 'react';

import { PlatformName } from '~/types/common';
import { formatName, getPlatformName } from '~/ui/components/Tag/helpers';

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
        'mr-2 inline-flex min-h-6 items-center gap-1 rounded-xl bg-element px-2.5 text-secondary select-none',
        '[&_svg]:size-3.5 [&_svg]:text-icon-default [&_svg]:opacity-100',
        'last:mr-0',
        '[table_&]:mt-0 [table_&]:px-1.5 [table_&]:py-0.5',
        '[h3_&]:last-of-type:mr-0 [h4_&]:last-of-type:mr-0',
        className
      )}
      {...rest}>
      <PlatformIcon platform={platformName} />
      <span className={mergeClasses('text-xs! leading-[normal]! font-normal whitespace-nowrap')}>
        {displayLabel}
      </span>
      {suffix}
    </div>
  );
};
