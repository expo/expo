import { mergeClasses } from '@expo/styleguide';

import { PlatformTag } from '~/ui/components/Tag/PlatformTag';

type Props = {
  platforms: string[];
  className?: string;
};

export function PagePlatformTags({ platforms, className }: Props) {
  return (
    <div className={mergeClasses('inline-flex flex-wrap gap-y-1.5', className)}>
      {platforms
        .sort((a, b) => a.localeCompare(b))
        .map(platform => {
          const text = platform.includes('*') ? platform.replace('*', ' (device only)') : platform;
          return <PlatformTag platform={text} key={text} className="rounded-full px-2.5 py-1.5" />;
        })}
    </div>
  );
}
