import { mergeClasses } from '@expo/styleguide';

import { STYLES_SECONDARY } from '~/components/plugins/api/styles';
import { usePageApiVersion } from '~/providers/page-api-version';
import { usePageMetadata } from '~/providers/page-metadata';
import { PlatformTags } from '~/ui/components/Tag/PlatformTags';
import { StatusTag } from '~/ui/components/Tag/StatusTag';

import { CommentData, CommentTagData } from '../APIDataTypes';
import { getAllTagData, getCommentContent } from '../APISectionUtils';

type Props = {
  comment?: CommentData;
  prefix?: string;
  platforms?: CommentTagData[];
  userProvidedPlatforms?: string[];
  disableFallback?: boolean;
  className?: string;
};

export const APISectionPlatformTags = ({
  comment,
  platforms,
  prefix,
  userProvidedPlatforms,
  className,
  disableFallback = false,
}: Props) => {
  const { platforms: defaultPlatforms } = usePageMetadata();
  const { version } = usePageApiVersion();

  const isCompatibleVersion = ['unversioned', 'latest', 'v52.0.0'].includes(version);
  const platformsData = platforms ?? getAllTagData('platform', comment);
  const experimentalData = getAllTagData('experimental', comment);

  const platformNames =
    userProvidedPlatforms ??
    (platformsData.length > 0
      ? platformsData?.map(platformData => getCommentContent(platformData.content))
      : isCompatibleVersion && !disableFallback
        ? defaultPlatforms?.map(platform => platform.replace('*', ''))
        : []);

  if (experimentalData.length === 0 && !platformNames?.length) {
    return null;
  }

  return (
    <div className={mergeClasses('mb-3 flex flex-row items-start [table_&]:mb-2.5', className)}>
      {experimentalData.length > 0 && (
        <div className="inline-flex flex-row">
          <StatusTag status="experimental" className="!mr-0" />
          <span className={mergeClasses(STYLES_SECONDARY)}>&ensp;&bull;&ensp;</span>
        </div>
      )}
      <PlatformTags
        prefix={isCompatibleVersion ? prefix : (prefix ?? 'Only for:')}
        platforms={platformNames}
      />
    </div>
  );
};
