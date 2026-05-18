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
        const platformLower = platform.toLowerCase();
        const isExpoGo = platformLower.includes('expo-go');

        if (!isExpoGo) {
          return <PlatformTag key={text} platform={text} className="rounded-full px-2.5 py-1.5" />;
        }

        return (
          <PlatformTag
            key={text}
            platform="expo-go"
            label="Included in Expo Go"
            className="rounded-full border-palette-gray4 bg-palette-gray3 px-2.5 py-1.5 text-palette-gray12 dark:border-palette-gray4 dark:bg-palette-gray4"
          />
        );
      })}
    </div>
  );
}
