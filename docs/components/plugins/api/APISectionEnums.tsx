import React from 'react';

import { InlineCode } from '~/components/base/code';
import { LI, UL } from '~/components/base/list';
import { H2, H3Code } from '~/components/plugins/Headings';
import { EnumDefinitionData, EnumValueData } from '~/components/plugins/api/APIDataTypes';
import { CommentTextBlock, mdInlineRenderers } from '~/components/plugins/api/APISectionUtils';

export type APISectionEnumsProps = {
  data: EnumDefinitionData[];
};

const renderEnum = ({ name, children, comment }: EnumDefinitionData): JSX.Element => (
  <div key={`enum-definition-${name}`}>
    <H3Code>
      <InlineCode>{name}</InlineCode>
    </H3Code>
    <CommentTextBlock comment={comment} />
    <UL>
      {children.map((enumValue: EnumValueData) => (
        <LI key={enumValue.name}>
          <InlineCode>
            {name}.{enumValue.name}
          </InlineCode>
          <CommentTextBlock comment={enumValue.comment} renderers={mdInlineRenderers} withDash />
        </LI>
      ))}
    </UL>
  </div>
);

const APISectionEnums: React.FC<APISectionEnumsProps> = ({ data }) =>
  data?.length ? (
    <>
      <H2 key="enums-header">Enums</H2>
      {data.map(renderEnum)}
    </>
  ) : null;

export default APISectionEnums;
