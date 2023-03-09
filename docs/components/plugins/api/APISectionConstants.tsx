import { APIDataType } from '~/components/plugins/api/APIDataType';
import { ConstantDefinitionData } from '~/components/plugins/api/APIDataTypes';
import { APISectionDeprecationNote } from '~/components/plugins/api/APISectionDeprecationNote';
import { APISectionPlatformTags } from '~/components/plugins/api/APISectionPlatformTags';
import {
  CommentTextBlock,
  getTagNamesList,
  STYLE_APIBOX_NO_SPACING,
  STYLES_APIBOX,
  H3Code,
} from '~/components/plugins/api/APISectionUtils';
import { H2, BOLD, P, MONOSPACE } from '~/ui/components/Text';

export type APISectionConstantsProps = {
  data: ConstantDefinitionData[];
  apiName?: string;
};

const renderConstant = (
  { name, comment, type }: ConstantDefinitionData,
  apiName?: string
): JSX.Element => (
  <div key={`constant-definition-${name}`} css={STYLES_APIBOX}>
    <APISectionDeprecationNote comment={comment} />
    <APISectionPlatformTags comment={comment} prefix="Only for:" />
    <H3Code tags={getTagNamesList(comment)}>
      <MONOSPACE weight="medium">
        {apiName ? `${apiName}.` : ''}
        {name}
      </MONOSPACE>
    </H3Code>
    {type && (
      <P>
        <BOLD>Type:</BOLD> <APIDataType typeDefinition={type} />
      </P>
    )}
    {comment && (
      <div css={STYLE_APIBOX_NO_SPACING}>
        <CommentTextBlock comment={comment} includePlatforms={false} beforeContent={<br />} />
      </div>
    )}
  </div>
);

const APISectionConstants = ({ data, apiName }: APISectionConstantsProps) =>
  data?.length ? (
    <>
      <H2 key="constants-header">Constants</H2>
      {data.map(constant => renderConstant(constant, apiName))}
    </>
  ) : null;

export default APISectionConstants;
