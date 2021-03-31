import React from 'react';

import { InlineCode } from '~/components/base/code';
import { H2, H3Code } from '~/components/plugins/Headings';
import {
  CommentData,
  CommentTextBlock,
  renderers,
  TypeDocKind,
} from '~/components/plugins/api/APISectionUtils';

export type APISectionConstantsProps = {
  data: ConstantDefinitionData[];
  apiName?: string;
};

export type ConstantDefinitionData = {
  name: string;
  flags: {
    isConst: boolean;
  };
  comment?: CommentData;
  kind: TypeDocKind;
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
    <CommentTextBlock comment={comment} renderers={renderers} />
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
