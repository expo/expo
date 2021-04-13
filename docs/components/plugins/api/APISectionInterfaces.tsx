import React from 'react';

import { InlineCode } from '~/components/base/code';
import { LI, UL } from '~/components/base/list';
import { H2, H3Code } from '~/components/plugins/Headings';
import { InterfaceDefinitionData, InterfaceValueData } from '~/components/plugins/api/APIDataTypes';
import { CommentTextBlock, mdInlineRenderers } from '~/components/plugins/api/APISectionUtils';

export type APISectionInterfacesProps = {
  data: InterfaceDefinitionData[];
};

const renderInterface = ({ name, children, comment }: InterfaceDefinitionData): JSX.Element => (
  <div key={`interface-definition-${name}`}>
    <H3Code>
      <InlineCode>{name}</InlineCode>
    </H3Code>
    <CommentTextBlock comment={comment} />
    <UL>
      {children.map((interfaceValue: InterfaceValueData) => (
        <LI key={interfaceValue.name}>
          <InlineCode>
            {name}.{interfaceValue.name}
            {interfaceValue.type.declaration?.signatures ? '()' : ''}
          </InlineCode>
          <CommentTextBlock
            comment={interfaceValue.comment}
            renderers={mdInlineRenderers}
            withDash
          />
        </LI>
      ))}
    </UL>
  </div>
);

const APISectionInterfaces: React.FC<APISectionInterfacesProps> = ({ data }) =>
  data?.length ? (
    <>
      <H2 key="interfaces-header">Interfaces</H2>
      {data.map(renderInterface)}
    </>
  ) : null;

export default APISectionInterfaces;
