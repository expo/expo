import { mergeClasses } from '@expo/styleguide';

import { STYLES_SECONDARY } from '~/components/plugins/api/styles';
import { PlatformName } from '~/types/common';
import { CALLOUT } from '~/ui/components/Text';

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
        <span className={mergeClasses(STYLES_SECONDARY, '[table_&]:!text-2xs')}>
          {prefix}&ensp;
        </span>
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
