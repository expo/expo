import { mergeClasses } from '@expo/styleguide';

import { PlatformIcon } from './PlatformIcon';
import { TagProps } from './Tag';

import { PlatformName } from '~/types/common';
import { formatName, getPlatformName, getTagClasses } from '~/ui/components/Tag/helpers';

type PlatformTagProps = Omit<TagProps, 'name'> & {
  platform: PlatformName;
};

export const PlatformTag = ({ platform, className }: PlatformTagProps) => {
  const platformName = getPlatformName(platform);

  return (
    <div
      className={mergeClasses(
        'mr-2 inline-flex select-none items-center gap-1 rounded-full border border-default bg-element px-2 py-1',
        '[table_&]:mt-0 [table_&]:px-1.5 [table_&]:py-0.5',
        '[h3_&]:last-of-type:mr-0 [h4_&]:last-of-type:mr-0',
        getTagClasses(platformName),
        className
      )}>
      <PlatformIcon platform={platformName} />
      <span className={mergeClasses('text-2xs font-normal !leading-[16px]', '[table_&]:text-3xs')}>
        {formatName(platform)}
      </span>
    </div>
  );
};
