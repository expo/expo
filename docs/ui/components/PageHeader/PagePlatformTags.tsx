import { mergeClasses } from '@expo/styleguide';

import { PlatformTag } from '~/ui/components/Tag/PlatformTag';
import { isClientPlatformTag } from '~/ui/components/Tag/helpers';

type Props = {
  platforms: string[];
  className?: string;
};

const CLIENT_PLATFORM_LABELS: Record<string, string> = {
  'expo-go': 'included in Expo Go',
  'expo-widgets': 'available in Widgets',
};

export function PagePlatformTags({ platforms, className }: Props) {
  const standardPlatforms = platforms
    .filter(platform => !isClientPlatformTag(platform))
    .sort((a, b) => a.localeCompare(b));
  const runtimePlatformsOrdered = platforms.filter(platform => isClientPlatformTag(platform));
  const orderedPlatforms = [...standardPlatforms, ...runtimePlatformsOrdered];

  return (
    <div className={mergeClasses('inline-flex flex-wrap gap-1', className)}>
      {orderedPlatforms.map(platform => {
        const text = platform.includes('*') ? platform.replace('*', ' (device only)') : platform;
        const platformLower = platform.toLowerCase();
        const clientLabel = CLIENT_PLATFORM_LABELS[platformLower];

        if (!clientLabel) {
          return <PlatformTag key={text} platform={text} className="mr-0" />;
        }

        return (
          <PlatformTag key={text} platform={platformLower} label={clientLabel} className="mr-0" />
        );
      })}
    </div>
  );
}
