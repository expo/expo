import React from 'react';
import ReactMarkdown from 'react-markdown';

import { InlineCode } from '~/components/base/code';
import { LI, UL } from '~/components/base/list';
import { H2, H3Code } from '~/components/plugins/Headings';
import { TypeDeclarationData } from '~/components/plugins/api/APISectionTypes';
import {
  CommentData,
  inlineRenderers,
  TypeDocKind,
} from '~/components/plugins/api/APISectionUtils';

export type APISectionInterfacesProps = {
  data: InterfaceDefinitionData[];
};

export type InterfaceDefinitionData = {
  name: string;
  children: InterfaceValueData[];
  comment?: CommentData;
  kind: TypeDocKind;
};

export type InterfaceValueData = {
  name: string;
  type: TypeDeclarationData;
  kind: TypeDocKind;
  comment?: CommentData;
};

const renderInterface = ({ name, children, comment }: InterfaceDefinitionData): JSX.Element => (
  <div key={`interface-definition-${name}`}>
    <H3Code>
      <InlineCode>{name}</InlineCode>
    </H3Code>
    {comment?.shortText ? (
      <ReactMarkdown renderers={inlineRenderers}>{comment.shortText}</ReactMarkdown>
    ) : null}
    <UL>
      {children.map((interfaceValue: InterfaceValueData) => (
        <LI key={interfaceValue.name}>
          <InlineCode>
            {name}.{interfaceValue.name}
            {interfaceValue.type.declaration.signatures ? '()' : ''}
          </InlineCode>
          {interfaceValue?.comment?.shortText ? (
            <>
              {' - '}
              <ReactMarkdown renderers={inlineRenderers}>
                {interfaceValue.comment.shortText}
              </ReactMarkdown>
            </>
          ) : null}
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
