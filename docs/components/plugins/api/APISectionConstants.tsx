import { mergeClasses } from '@expo/styleguide';

import { H2, P, MONOSPACE } from '~/ui/components/Text';

import { ConstantDefinitionData } from './APIDataTypes';
import { APISectionDeprecationNote } from './APISectionDeprecationNote';
import { getTagNamesList, H3Code } from './APISectionUtils';
import { APICommentTextBlock } from './components/APICommentTextBlock';
import { APIDataType } from './components/APIDataType';
import { APISectionPlatformTags } from './components/APISectionPlatformTags';
import { STYLES_APIBOX, STYLES_SECONDARY } from './styles';

export type APISectionConstantsProps = {
  data: ConstantDefinitionData[];
  sdkVersion: string;
  apiName?: string;
};

const renderConstant = (
  { name, comment, type }: ConstantDefinitionData,
  sdkVersion: string,
  apiName?: string
): JSX.Element => (
  <div
    key={`constant-definition-${name}`}
    className={mergeClasses(STYLES_APIBOX, '[&>*:last-child]:!mb-0')}>
    <APISectionDeprecationNote comment={comment} sticky />
    <div className="grid grid-cols-auto-min-2 gap-2 max-md-gutters:grid-cols-1">
      <H3Code tags={getTagNamesList(comment)}>
        <MONOSPACE weight="medium" className="wrap-anywhere">
          {apiName ? `${apiName}.` : ''}
          {name}
        </MONOSPACE>
      </H3Code>
      <APISectionPlatformTags comment={comment} />
    </div>
    {type && (
      <P className={STYLES_SECONDARY}>
        Type: <APIDataType typeDefinition={type} sdkVersion={sdkVersion} />
      </P>
    )}
    {comment && (
      <APICommentTextBlock comment={comment} includePlatforms={false} beforeContent={<br />} />
    )}
  </div>
);

const APISectionConstants = ({ data, sdkVersion, apiName }: APISectionConstantsProps) =>
  data?.length ? (
    <>
      <H2 key="constants-header">Constants</H2>
      {data.map(constant => renderConstant(constant, sdkVersion, apiName))}
    </>
  ) : null;

export default APISectionConstants;
