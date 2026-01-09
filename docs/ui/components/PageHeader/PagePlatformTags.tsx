import { mergeClasses } from '@expo/styleguide';

import { PlatformTag } from '~/ui/components/Tag/PlatformTag';
import { isClientPlatformTag } from '~/ui/components/Tag/helpers';

type Props = {
  platforms: string[];
  className?: string;
};

export function PagePlatformTags({ platforms, className }: Props) {
  const standardPlatforms = platforms
    .filter(platform => !isClientPlatformTag(platform))
    .sort((a, b) => a.localeCompare(b));
  const runtimePlatformsOrdered = platforms.filter(platform => isClientPlatformTag(platform));
  const orderedPlatforms = [...standardPlatforms, ...runtimePlatformsOrdered];

  return (
    <div className={mergeClasses('inline-flex flex-wrap gap-y-1.5', className)}>
      {orderedPlatforms.map(platform => {
        const text = platform.includes('*') ? platform.replace('*', ' (device only)') : platform;
        return <PlatformTag platform={text} key={text} className="rounded-full px-2.5 py-1.5" />;
      })}
    </div>
  );
}
