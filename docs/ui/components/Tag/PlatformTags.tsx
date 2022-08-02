import { PlatformTag } from './PlatformTag';

import { B } from '~/components/base/paragraph';
import { PlatformName } from '~/types/common';

type PlatformTagsProps = {
  prefix?: string;
  platforms?: PlatformName[];
  firstElement?: boolean;
};

export const PlatformTags = ({ prefix, firstElement, platforms }: PlatformTagsProps) => {
  return platforms?.length ? (
    <>
      {prefix && <B>{prefix}&ensp;</B>}
      {platforms.map(platform => {
        return <PlatformTag key={platform} platform={platform} firstElement={firstElement} />;
      })}
      {prefix && <br />}
    </>
  ) : null;
};
