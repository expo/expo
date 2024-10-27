import { CommentData, CommentTagData } from '~/components/plugins/api/APIDataTypes';
import { getAllTagData, getCommentContent } from '~/components/plugins/api/APISectionUtils';
import { usePageApiVersion } from '~/providers/page-api-version';
import { usePageMetadata } from '~/providers/page-metadata';
import { PlatformTags, StatusTag } from '~/ui/components/Tag';
import { CALLOUT } from '~/ui/components/Text';

type Props = {
  comment?: CommentData;
  prefix?: string;
  platforms?: CommentTagData[];
  userProvidedPlatforms?: string[];
  disableFallback?: boolean;
};

export const APISectionPlatformTags = ({
  comment,
  platforms,
  prefix,
  userProvidedPlatforms,
  disableFallback = false,
}: Props) => {
  const { platforms: defaultPlatforms } = usePageMetadata();
  const { version } = usePageApiVersion();

  const isUnversionedVersion = version === 'unversioned';
  const platformsData = platforms || getAllTagData('platform', comment);
  const experimentalData = getAllTagData('experimental', comment);

  const platformNames = userProvidedPlatforms
    ? userProvidedPlatforms
    : platformsData.length > 0
      ? platformsData?.map(platformData => getCommentContent(platformData.content))
      : isUnversionedVersion && !disableFallback
        ? defaultPlatforms?.map(platform => platform.replace('*', ''))
        : [];

  if (!experimentalData.length && !platformNames?.length) {
    return null;
  }

  return (
    <div className="flex flex-row items-center mb-2">
      {experimentalData.length > 0 && (
        <CALLOUT tag="span" theme="secondary" className="inline-flex flex-row">
          <StatusTag status="experimental" className="!mr-0" />
          <span className="leading-[26px]">&emsp;&bull;&emsp;</span>
        </CALLOUT>
      )}
      <PlatformTags
        prefix={isUnversionedVersion ? prefix : prefix ?? 'Only for:'}
        platforms={platformNames}
      />
    </div>
  );
};
