import { PlatformTag } from './PlatformTag';

import { PlatformName } from '~/types/common';
import { BOLD } from '~/ui/components/Text';

type PlatformTagsProps = {
  prefix?: string;
  platforms?: PlatformName[];
};

export const PlatformTags = ({ prefix, platforms }: PlatformTagsProps) => {
  return platforms?.length ? (
    <>
      {prefix && <BOLD>{prefix}&ensp;</BOLD>}
      {platforms.map(platform => {
        return <PlatformTag key={platform} platform={platform} />;
      })}
      {prefix && <br />}
    </>
  ) : null;
};
