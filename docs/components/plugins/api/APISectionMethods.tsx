import React from 'react';
import ReactMarkdown from 'react-markdown';

import { InlineCode } from '~/components/base/code';
import { LI, UL } from '~/components/base/list';
import { H2, H3Code, H4 } from '~/components/plugins/Headings';
import {
  MethodDefinitionData,
  MethodSignatureData,
  PropData,
} from '~/components/plugins/api/APIDataTypes';
import {
  CommentTextBlock,
  getPlatformTags,
  listParams,
  mdComponents,
  renderParam,
  resolveTypeName,
} from '~/components/plugins/api/APISectionUtils';

export type APISectionMethodsProps = {
  data: MethodDefinitionData[];
  apiName?: string;
  header?: string;
};

export const renderMethod = (
  { signatures = [] }: MethodDefinitionData | PropData,
  index?: number,
  dataLength?: number,
  apiName?: string,
  header?: string
): JSX.Element[] =>
  signatures.map(({ name, parameters, comment, type }: MethodSignatureData) => (
    <div key={`method-signature-${name}-${parameters?.length || 0}`}>
      <H3Code>
        <InlineCode>
          {apiName && `${apiName}.`}
          {header !== 'Hooks' ? `${name}(${listParams(parameters)})` : name}
        </InlineCode>
      </H3Code>
      {getPlatformTags(comment)}
      <CommentTextBlock
        comment={comment}
        beforeContent={
          parameters && (
            <>
              <H4>Arguments</H4>
              <UL>{parameters?.map(renderParam)}</UL>
            </>
          )
        }
        includePlatforms={false}
      />
      {resolveTypeName(type) !== 'undefined' ? (
        <div>
          <H4>Returns</H4>
          <UL>
            <LI returnType>
              <InlineCode>{resolveTypeName(type)}</InlineCode>
            </LI>
          </UL>
          {comment?.returns && (
            <ReactMarkdown components={mdComponents}>{comment.returns}</ReactMarkdown>
          )}
        </div>
      ) : null}
      {index !== undefined ? index + 1 !== dataLength && <hr /> : null}
    </div>
  ));

const APISectionMethods = ({ data, apiName, header = 'Methods' }: APISectionMethodsProps) =>
  data?.length ? (
    <>
      <H2 key="methods-header">{header}</H2>
      {data.map((method, index) => renderMethod(method, index, data.length, apiName, header))}
    </>
  ) : null;

export default APISectionMethods;
