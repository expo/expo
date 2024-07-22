import { PlatformTag } from '~/ui/components/Tag';
import { FOOTNOTE } from '~/ui/components/Text';
import * as Tooltip from '~/ui/components/Tooltip';

type Props = {
  platforms: string[];
};

export function PagePlatformTags({ platforms }: Props) {
  return (
    <div className="inline-flex mt-3 flex-wrap gap-y-1.5">
      {platforms
        .sort((a, b) => a.localeCompare(b))
        .map(platform => {
          if (platform.includes('*')) {
            return (
              <Tooltip.Root key={platform}>
                <Tooltip.Trigger className="cursor-default">
                  <PlatformTag platform={platform} className="!rounded-full !px-2.5" />
                </Tooltip.Trigger>
                <Tooltip.Content side="bottom">
                  {platform.startsWith('android') && (
                    <FOOTNOTE>Android Emulator not supported</FOOTNOTE>
                  )}
                  {platform.startsWith('ios') && <FOOTNOTE>iOS Simulator not supported</FOOTNOTE>}
                </Tooltip.Content>
              </Tooltip.Root>
            );
          }
          return (
            <PlatformTag platform={platform} key={platform} className="!rounded-full !px-2.5" />
          );
        })}
    </div>
  );
}
