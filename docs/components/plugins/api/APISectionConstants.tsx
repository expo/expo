import { mergeClasses } from '@expo/styleguide';

import { APIDataType } from './APIDataType';
import { ConstantDefinitionData } from './APIDataTypes';
import { APISectionDeprecationNote } from './APISectionDeprecationNote';
import { APISectionPlatformTags } from './APISectionPlatformTags';
import { CommentTextBlock, getTagNamesList, H3Code } from './APISectionUtils';
import { STYLES_APIBOX } from './styles';

import { H2, DEMI, P, MONOSPACE } from '~/ui/components/Text';

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
    <APISectionPlatformTags comment={comment} />
    <H3Code tags={getTagNamesList(comment)}>
      <MONOSPACE weight="medium" className="wrap-anywhere">
        {apiName ? `${apiName}.` : ''}
        {name}
      </MONOSPACE>
    </H3Code>
    {type && (
      <P>
        <DEMI theme="secondary">Type:</DEMI>{' '}
        <APIDataType typeDefinition={type} sdkVersion={sdkVersion} />
      </P>
    )}
    {comment && (
      <CommentTextBlock comment={comment} includePlatforms={false} beforeContent={<br />} />
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
