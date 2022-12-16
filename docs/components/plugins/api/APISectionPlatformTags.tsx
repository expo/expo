import React from 'react';

import { CommentData, CommentTagData } from '~/components/plugins/api/APIDataTypes';
import { getAllTagData } from '~/components/plugins/api/APISectionUtils';
import { PlatformTags } from '~/ui/components/Tag';

type Props = {
  comment?: CommentData;
  prefix?: string;
  platforms?: CommentTagData[];
};

export const APISectionPlatformTags = ({ comment, prefix, platforms }: Props) => {
  const platformsData = platforms || getAllTagData('platform', comment);
  const platformNames = platformsData?.map(platformData => platformData.text);

  return <PlatformTags prefix={prefix} platforms={platformNames} />;
};
