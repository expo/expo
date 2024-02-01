import { APIDataType } from '~/components/plugins/api/APIDataType';
import { ConstantDefinitionData } from '~/components/plugins/api/APIDataTypes';
import { APISectionDeprecationNote } from '~/components/plugins/api/APISectionDeprecationNote';
import { APISectionPlatformTags } from '~/components/plugins/api/APISectionPlatformTags';
import {
  CommentTextBlock,
  getTagNamesList,
  STYLES_APIBOX,
  H3Code,
} from '~/components/plugins/api/APISectionUtils';
import { H2, DEMI, P, MONOSPACE } from '~/ui/components/Text';

export type APISectionConstantsProps = {
  data: ConstantDefinitionData[];
  apiName?: string;
};

const renderConstant = (
  { name, comment, type }: ConstantDefinitionData,
  apiName?: string
): JSX.Element => (
  <div key={`constant-definition-${name}`} css={STYLES_APIBOX} className="[&>*:last-child]:!mb-0">
    <APISectionDeprecationNote comment={comment} />
    <APISectionPlatformTags comment={comment} />
    <H3Code tags={getTagNamesList(comment)}>
      <MONOSPACE weight="medium" className="wrap-anywhere">
        {apiName ? `${apiName}.` : ''}
        {name}
      </MONOSPACE>
    </H3Code>
    {type && (
      <P>
        <DEMI theme="secondary">Type:</DEMI> <APIDataType typeDefinition={type} />
      </P>
    )}
    {comment && (
      <CommentTextBlock comment={comment} includePlatforms={false} beforeContent={<br />} />
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
