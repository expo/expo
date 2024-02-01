import { PlatformTag } from './PlatformTag';

import { PlatformName } from '~/types/common';
import { DEMI, CALLOUT } from '~/ui/components/Text';

type PlatformTagsProps = {
  prefix?: string;
  platforms?: PlatformName[];
};

export const PlatformTags = ({ prefix, platforms }: PlatformTagsProps) => {
  if (!platforms?.length) return null;

  return (
    <CALLOUT tag="span" className="inline-flex items-center mb-2">
      {prefix && (
        <DEMI theme="secondary" className="!text-inherit !font-medium">
          {prefix}&ensp;
        </DEMI>
      )}
      {platforms.map(platform => (
        <PlatformTag key={platform} platform={platform} />
      ))}
      {prefix && <br />}
    </CALLOUT>
  );
};
