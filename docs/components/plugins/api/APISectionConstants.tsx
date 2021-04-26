import React from 'react';

import { InlineCode } from '~/components/base/code';
import { H2, H3Code } from '~/components/plugins/Headings';
import { ConstantDefinitionData } from '~/components/plugins/api/APIDataTypes';
import { CommentTextBlock } from '~/components/plugins/api/APISectionUtils';

export type APISectionConstantsProps = {
  data: ConstantDefinitionData[];
  apiName?: string;
};

const renderConstant = (
  { name, comment }: ConstantDefinitionData,
  apiName?: string
): JSX.Element => (
  <div key={`constant-definition-${name}`}>
    <H3Code>
      <InlineCode>
        {apiName ? `${apiName}.` : ''}
        {name}
      </InlineCode>
    </H3Code>
    <CommentTextBlock comment={comment} />
  </div>
);

const APISectionConstants: React.FC<APISectionConstantsProps> = ({ data, apiName }) =>
  data?.length ? (
    <>
      <H2 key="constants-header">Constants</H2>
      {data.map(constant => renderConstant(constant, apiName))}
    </>
  ) : null;

export default APISectionConstants;
