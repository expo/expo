import { CommentData, CommentTagData } from '~/components/plugins/api/APIDataTypes';
import { getAllTagData, getCommentContent } from '~/components/plugins/api/APISectionUtils';
import { PlatformTags, StatusTag } from '~/ui/components/Tag';
import { CALLOUT } from '~/ui/components/Text';

type Props = {
  comment?: CommentData;
  prefix?: string;
  platforms?: CommentTagData[];
};

export const APISectionPlatformTags = ({ comment, platforms, prefix = 'Only for:' }: Props) => {
  const platformsData = platforms || getAllTagData('platform', comment);
  const experimentalData = getAllTagData('experimental', comment);
  const platformNames = platformsData?.map(platformData => getCommentContent(platformData.content));

  if (!experimentalData.length && !platformsData.length) {
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
      <PlatformTags prefix={prefix} platforms={platformNames} />
    </div>
  );
};
