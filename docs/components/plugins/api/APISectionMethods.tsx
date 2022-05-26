import { css } from '@emotion/react';
import React from 'react';
import ReactMarkdown from 'react-markdown';

import { InlineCode } from '~/components/base/code';
import { LI, UL } from '~/components/base/list';
import { H2, H3Code, H4, H4Code } from '~/components/plugins/Headings';
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
  data: (MethodDefinitionData | PropData)[];
  apiName?: string;
  header?: string;
};

const STYLES_NOT_EXPOSED_HEADER = css({ marginTop: 20, marginBottom: 10, display: 'inline-block' });

export const renderMethod = (
  { signatures = [] }: MethodDefinitionData | PropData,
  index?: number,
  dataLength?: number,
  apiName?: string,
  header?: string,
  exposeInSidebar: boolean = true
): JSX.Element[] => {
  const HeaderComponent = exposeInSidebar ? H3Code : H4Code;
  return signatures.map(({ name, parameters, comment, type }: MethodSignatureData) => (
    <div key={`method-signature-${name}-${parameters?.length || 0}`}>
      <HeaderComponent>
        <InlineCode customCss={STYLES_NOT_EXPOSED_HEADER}>
          {apiName && `${apiName}.`}
          {header !== 'Hooks' ? `${name}(${listParams(parameters)})` : name}
        </InlineCode>
      </HeaderComponent>
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
        <>
          <H4>Returns</H4>
          <UL>
            <LI returnType>
              <InlineCode>{resolveTypeName(type)}</InlineCode>
            </LI>
          </UL>
          {comment?.returns && (
            <ReactMarkdown components={mdComponents}>{comment.returns}</ReactMarkdown>
          )}
        </>
      ) : null}
      {index !== undefined ? index + 1 !== dataLength && <hr /> : null}
    </div>
  ));
};

const APISectionMethods = ({ data, apiName, header = 'Methods' }: APISectionMethodsProps) =>
  data?.length ? (
    <>
      <H2 key="methods-header">{header}</H2>
      {data.map((method: MethodDefinitionData | PropData, index: number) =>
        renderMethod(method, index, data.length, apiName, header)
      )}
    </>
  ) : null;

export default APISectionMethods;
