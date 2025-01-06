import { mergeClasses } from '@expo/styleguide';

import { CALLOUT, H2 } from '~/ui/components/Text';

import { ConstantDefinitionData } from './APIDataTypes';
import { APISectionDeprecationNote } from './APISectionDeprecationNote';
import { APIBoxHeader } from './components/APIBoxHeader';
import { APICommentTextBlock } from './components/APICommentTextBlock';
import { APIDataType } from './components/APIDataType';
import { ELEMENT_SPACING, STYLES_APIBOX, STYLES_SECONDARY, VERTICAL_SPACING } from './styles';

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
  <div key={`constant-definition-${name}`} className={STYLES_APIBOX}>
    <APISectionDeprecationNote comment={comment} sticky />
    <APIBoxHeader name={`${apiName ? `${apiName}.` : ''}${name}`} comment={comment} />
    {type && (
      <CALLOUT className={mergeClasses(STYLES_SECONDARY, ELEMENT_SPACING, VERTICAL_SPACING)}>
        Type: <APIDataType typeDefinition={type} sdkVersion={sdkVersion} />
      </CALLOUT>
    )}
    {comment && <APICommentTextBlock comment={comment} includePlatforms={false} inlineHeaders />}
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
