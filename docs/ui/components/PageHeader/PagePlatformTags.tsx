import { PlatformTag } from '~/ui/components/Tag/PlatformTag';

type Props = {
  platforms: string[];
};

export function PagePlatformTags({ platforms }: Props) {
  return (
    <div className="inline-flex flex-wrap">
      {platforms
        .sort((a, b) => a.localeCompare(b))
        .map(platform => {
          const text = platform.includes('*') ? platform.replace('*', ' (device only)') : platform;
          return <PlatformTag platform={text} key={text} className="rounded-full px-2.5 py-1.5" />;
        })}
    </div>
  );
}
