import React from 'react';
import ReactMarkdown from 'react-markdown';

import { InlineCode } from '~/components/base/code';
import { LI, UL } from '~/components/base/list';
import { B, Quote } from '~/components/base/paragraph';
import { H2, H3Code, H4 } from '~/components/plugins/Headings';
import { MethodDefinitionData, MethodSignatureData } from '~/components/plugins/api/APIDataTypes';
import {
  CommentTextBlock,
  mdRenderers,
  renderParam,
  resolveTypeName,
} from '~/components/plugins/api/APISectionUtils';

export type APISectionMethodsProps = {
  data: MethodDefinitionData[];
  apiName?: string;
  header?: string;
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
          {name}({parameters?.map(param => param.name).join(', ')})
        </InlineCode>
      </H3Code>
      {comment?.tags
        ?.filter(tag => tag.tag === 'deprecated')
        .map(tag => (
          <Quote>
            <B>{tag.text}</B>
          </Quote>
        ))}
      {parameters ? <H4>Arguments</H4> : null}
      {parameters ? <UL>{parameters?.map(renderParam)}</UL> : null}
      <CommentTextBlock comment={comment} />
      {resolveTypeName(type) !== 'undefined' ? (
        <div>
          <H4>Returns</H4>
          <UL>
            <LI returnType>
              <InlineCode>{resolveTypeName(type)}</InlineCode>
            </LI>
          </UL>
          {comment?.returns ? (
            <ReactMarkdown renderers={mdRenderers}>{comment.returns}</ReactMarkdown>
          ) : null}
        </div>
      ) : null}
      {index + 1 !== dataLength ? <hr /> : null}
    </div>
  ));

const APISectionMethods: React.FC<APISectionMethodsProps> = ({
  data,
  apiName,
  header = 'Methods',
}) =>
  data?.length ? (
    <>
      <H2 key="methods-header">{header}</H2>
      {data.map((method, index) => renderMethod(method, index, data.length, apiName))}
    </>
  ) : null;

export default APISectionMethods;
