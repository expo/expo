import { PlatformTag } from './PlatformTag';

import { B } from '~/components/base/paragraph';
import { PlatformName } from '~/types/common';

type PlatformTagsProps = {
  prefix?: string;
  platforms?: PlatformName[];
};

export const PlatformTags = ({ prefix, platforms }: PlatformTagsProps) => {
  return platforms?.length ? (
    <>
      {prefix && <B>{prefix}&ensp;</B>}
      {platforms.map(platform => {
        return <PlatformTag key={platform} platform={platform} />;
      })}
      {prefix && <br />}
    </>
  ) : null;
};
