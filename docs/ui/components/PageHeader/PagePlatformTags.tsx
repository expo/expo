import { mergeClasses } from '@expo/styleguide';

import { PlatformTag } from '~/ui/components/Tag/PlatformTag';
import { isClientPlatformTag } from '~/ui/components/Tag/helpers';
import { A, FOOTNOTE } from '~/ui/components/Text';
import * as Tooltip from '~/ui/components/Tooltip';

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
        const isDevBuilds = platformLower.includes('dev-builds');

        if (!isExpoGo && !isDevBuilds) {
          return <PlatformTag key={text} platform={text} className="rounded-full px-2.5 py-1.5" />;
        }

        return (
          <Tooltip.Root key={text} delayDuration={300}>
            <Tooltip.Trigger asChild>
              <span className="mr-2 inline-flex last:mr-0">
                <PlatformTag platform={text} className="rounded-full px-2.5 py-1.5" />
              </span>
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom" align="start" className="max-w-[260px]">
              {isExpoGo ? (
                <FOOTNOTE>
                  This library is included in Expo Go. See "Bundled version" for the exact version
                  included in the Expo Go app.
                </FOOTNOTE>
              ) : (
                <FOOTNOTE>
                  This library is not available in the Expo Go app. Create a{' '}
                  <A href="/develop/development-builds/introduction">development build</A> to use
                  it.
                </FOOTNOTE>
              )}
            </Tooltip.Content>
          </Tooltip.Root>
        );
      })}
    </div>
  );
}
