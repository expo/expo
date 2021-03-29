import React from 'react';
import ReactMarkdown from 'react-markdown';

import { InlineCode } from '~/components/base/code';
import { LI, UL } from '~/components/base/list';
import { H2, H3Code, H4 } from '~/components/plugins/Headings';
import {
  CommentTextBlock,
  CommentData,
  MethodParamData,
  renderers,
  renderParam,
  resolveTypeName,
  TypeDefinitionData,
  TypeDocKind,
} from '~/components/plugins/api/APISectionUtils';

export type APISectionMethodsProps = {
  data: MethodDefinitionData[];
  apiName?: string;
};

export type MethodDefinitionData = {
  signatures: MethodSignatureData[];
  kind: TypeDocKind;
};

type MethodSignatureData = {
  name: string;
  parameters: MethodParamData[];
  comment: CommentData;
  type: TypeDefinitionData;
};

const renderMethod = (
  { signatures }: MethodDefinitionData,
  index: number,
  dataLength?: number,
  apiName?: string
): JSX.Element[] =>
  signatures.map(({ name, parameters, comment, type }: MethodSignatureData) => (
    <div key={`method-signature-${name}-${parameters?.length || 0}`}>
      <H3Code>
        <InlineCode>
          {apiName ? `${apiName}.` : ''}
          {name}()
        </InlineCode>
      </H3Code>
      {parameters ? <H4>Arguments</H4> : null}
      {parameters ? <UL>{parameters?.map(renderParam)}</UL> : null}
      <CommentTextBlock comment={comment} renderers={renderers} />
      {resolveTypeName(type) !== 'undefined' ? (
        <div>
          <H4>Returns</H4>
          <UL>
            <LI returnType>
              <InlineCode>{resolveTypeName(type)}</InlineCode>
            </LI>
          </UL>
          {comment?.returns ? (
            <ReactMarkdown renderers={renderers}>{comment.returns}</ReactMarkdown>
          ) : null}
        </div>
      ) : null}
      {index + 1 !== dataLength ? <hr /> : null}
    </div>
  ));

const APISectionMethods: React.FC<APISectionMethodsProps> = ({ data, apiName }) =>
  data?.length ? (
    <>
      <H2 key="methods-header">Methods</H2>
      {data.map((method, index) => renderMethod(method, index, data.length, apiName))}
    </>
  ) : null;

export default APISectionMethods;
