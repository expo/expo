import { PlatformName } from '~/types/common';
import { DEMI, CALLOUT } from '~/ui/components/Text';

import { PlatformTag } from './PlatformTag';

type PlatformTagsProps = {
  prefix?: string;
  platforms?: PlatformName[];
};

export const PlatformTags = ({ prefix, platforms }: PlatformTagsProps) => {
  if (!platforms?.length) {
    return null;
  }

  return (
    <CALLOUT tag="span" className="inline-flex items-center">
      {prefix && (
        <DEMI theme="secondary" className="!text-inherit !font-medium">
          {prefix}&ensp;
        </DEMI>
      )}
      {platforms
        .sort((a, b) => a.localeCompare(b))
        .map(platform => (
          <PlatformTag key={platform} platform={platform} />
        ))}
      {prefix && <br />}
    </CALLOUT>
  );
};
