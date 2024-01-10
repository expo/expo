import { PlatformTag } from './PlatformTag';

import { PlatformName } from '~/types/common';
import { DEMI, CALLOUT } from '~/ui/components/Text';

type PlatformTagsProps = {
  prefix?: string;
  platforms?: PlatformName[];
};

export const PlatformTags = ({ prefix, platforms }: PlatformTagsProps) => {
  return platforms?.length ? (
    <CALLOUT tag="span" className="flex items-center mb-2">
      {prefix && <DEMI className="!text-inherit">{prefix}&ensp;</DEMI>}
      {platforms.map(platform => {
        return <PlatformTag key={platform} platform={platform} />;
      })}
      {prefix && <br />}
    </CALLOUT>
  ) : null;
};
