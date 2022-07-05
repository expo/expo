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
import { PlatformTags } from '~/components/plugins/api/APISectionPlatformTags';
import {
  CommentTextBlock,
  listParams,
  mdComponents,
  renderParams,
  resolveTypeName,
  STYLES_APIBOX,
  STYLES_APIBOX_NESTED,
  STYLES_NESTED_SECTION_HEADER,
  STYLES_NOT_EXPOSED_HEADER,
} from '~/components/plugins/api/APISectionUtils';

export type APISectionMethodsProps = {
  data: (MethodDefinitionData | PropData)[];
  apiName?: string;
  header?: string;
};

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
    <div
      key={`method-signature-${name}-${parameters?.length || 0}`}
      css={[STYLES_APIBOX, !exposeInSidebar && STYLES_APIBOX_NESTED]}>
      <PlatformTags comment={comment} prefix="Only for:" firstElement />
      <HeaderComponent>
        <InlineCode customCss={!exposeInSidebar ? STYLES_NOT_EXPOSED_HEADER : undefined}>
          {apiName && `${apiName}.`}
          {header !== 'Hooks' ? `${name}(${listParams(parameters)})` : name}
        </InlineCode>
      </HeaderComponent>
      {parameters && renderParams(parameters)}
      <CommentTextBlock comment={comment} includePlatforms={false} />
      {resolveTypeName(type) !== 'undefined' && (
        <>
          <div css={STYLES_NESTED_SECTION_HEADER}>
            <H4>Returns</H4>
          </div>
          <UL>
            <LI returnType>
              <InlineCode>{resolveTypeName(type)}</InlineCode>
            </LI>
          </UL>
          {comment?.returns && (
            <ReactMarkdown components={mdComponents}>{comment.returns}</ReactMarkdown>
          )}
        </>
      )}
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
