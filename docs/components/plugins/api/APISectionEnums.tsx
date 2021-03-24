import React from 'react';
import ReactMarkdown from 'react-markdown';

import { InlineCode } from '~/components/base/code';
import { LI, UL } from '~/components/base/list';
import { H2, H3Code } from '~/components/plugins/Headings';
import { CommentData, inlineRenderers } from '~/components/plugins/api/APISectionUtils';

export type APISectionEnumsProps = {
  data: EnumDefinitionData[];
};

type EnumDefinitionData = {
  name: string;
  children: EnumValueData[];
  comment?: CommentData;
};

type EnumValueData = {
  name: string;
};

const renderEnum = ({ name, children, comment }: EnumDefinitionData): JSX.Element => (
  <div key={`enum-definition-${name}`}>
    <H3Code>
      <InlineCode>{name}</InlineCode>
    </H3Code>
    <UL>
      {children.map((enumValue: EnumValueData) => (
        <LI key={enumValue.name}>
          <InlineCode>
            {name}.{enumValue.name}
          </InlineCode>
          {comment?.shortText ? (
            <>
              {' - '}
              <ReactMarkdown renderers={inlineRenderers}>{comment.shortText}</ReactMarkdown>
            </>
          ) : null}
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
