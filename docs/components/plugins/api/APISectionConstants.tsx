import React from 'react';

import { InlineCode } from '~/components/base/code';
import { B, P } from '~/components/base/paragraph';
import { H2, H3Code } from '~/components/plugins/Headings';
import { ConstantDefinitionData } from '~/components/plugins/api/APIDataTypes';
import { CommentTextBlock, resolveTypeName } from '~/components/plugins/api/APISectionUtils';

export type APISectionConstantsProps = {
  data: ConstantDefinitionData[];
  apiName?: string;
};

const renderConstant = (
  { name, comment, type }: ConstantDefinitionData,
  apiName?: string
): JSX.Element => (
  <div key={`constant-definition-${name}`}>
    <H3Code>
      <InlineCode>
        {apiName ? `${apiName}.` : ''}
        {name}
      </InlineCode>
    </H3Code>
    {type && (
      <P>
        <B>Type:</B> <InlineCode>{resolveTypeName(type)}</InlineCode>
      </P>
    )}
    <CommentTextBlock comment={comment} />
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
