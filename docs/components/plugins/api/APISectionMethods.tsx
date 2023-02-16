import { css } from '@emotion/react';
import { theme, spacing, UndoIcon, iconSize } from '@expo/styleguide';
import ReactMarkdown from 'react-markdown';

import { APIDataType } from '~/components/plugins/api/APIDataType';
import {
  AccessorDefinitionData,
  MethodDefinitionData,
  MethodParamData,
  MethodSignatureData,
  PropData,
  TypeSignaturesData,
} from '~/components/plugins/api/APIDataTypes';
import { APISectionDeprecationNote } from '~/components/plugins/api/APISectionDeprecationNote';
import { APISectionPlatformTags } from '~/components/plugins/api/APISectionPlatformTags';
import {
  CommentTextBlock,
  getMethodName,
  getTagNamesList,
  mdComponents,
  renderParams,
  resolveTypeName,
  STYLES_APIBOX,
  STYLES_APIBOX_NESTED,
  STYLES_NESTED_SECTION_HEADER,
  STYLES_NOT_EXPOSED_HEADER,
  TypeDocKind,
  H3Code,
  H4Code,
  getTagData,
  getCommentContent,
} from '~/components/plugins/api/APISectionUtils';
import { H2, H4, LI, UL, CODE } from '~/ui/components/Text';

export type APISectionMethodsProps = {
  data: (MethodDefinitionData | PropData)[];
  apiName?: string;
  header?: string;
  exposeInSidebar?: boolean;
};

export type RenderMethodOptions = {
  apiName?: string;
  header?: string;
  exposeInSidebar?: boolean;
};

export const renderMethod = (
  method: MethodDefinitionData | AccessorDefinitionData | PropData,
  { apiName, exposeInSidebar = true }: RenderMethodOptions = {}
) => {
  const signatures =
    (method as MethodDefinitionData).signatures ||
    (method as PropData)?.type?.declaration?.signatures || [
      (method as AccessorDefinitionData)?.getSignature,
    ] ||
    [];
  const HeaderComponent = exposeInSidebar ? H3Code : H4Code;
  return signatures.map(
    ({ name, parameters, comment, type }: MethodSignatureData | TypeSignaturesData) => {
      const returnComment = getTagData('returns', comment);
      return (
        <div
          key={`method-signature-${method.name || name}-${parameters?.length || 0}`}
          css={[STYLES_APIBOX, STYLES_APIBOX_NESTED]}>
          <APISectionDeprecationNote comment={comment} />
          <APISectionPlatformTags comment={comment} prefix="Only for:" />
          <HeaderComponent tags={getTagNamesList(comment)}>
            <CODE css={!exposeInSidebar ? STYLES_NOT_EXPOSED_HEADER : undefined}>
              {getMethodName(method as MethodDefinitionData, apiName, name, parameters)}
            </CODE>
          </HeaderComponent>
          {parameters && parameters.length > 0 && (
            <>
              {renderParams(parameters)}
              <br />
            </>
          )}
          <CommentTextBlock comment={comment} includePlatforms={false} />
          {resolveTypeName(type) !== 'undefined' && (
            <>
              <div css={STYLES_NESTED_SECTION_HEADER}>
                <H4>Returns</H4>
              </div>
              <UL css={STYLES_NO_BULLET_LIST}>
                <LI>
                  <UndoIcon
                    color={theme.icon.secondary}
                    size={iconSize.sm}
                    css={returnIconStyles}
                  />
                  <APIDataType typeDefinition={type} />
                </LI>
              </UL>
              <>
                <br />
                {returnComment ? (
                  <ReactMarkdown components={mdComponents}>
                    {getCommentContent(returnComment.content)}
                  </ReactMarkdown>
                ) : undefined}
              </>
            </>
          )}
        </div>
      );
    }
  );
};

const APISectionMethods = ({
  data,
  apiName,
  header = 'Methods',
  exposeInSidebar = true,
}: APISectionMethodsProps) =>
  data?.length ? (
    <>
      <H2 key={`${header}-header`}>{header}</H2>
      {data.map((method: MethodDefinitionData | PropData) =>
        renderMethod(method, { apiName, header, exposeInSidebar })
      )}
    </>
  ) : null;

const returnIconStyles = css({
  transform: 'rotate(180deg)',
  marginRight: spacing[2],
  verticalAlign: 'middle',
});

export default APISectionMethods;

export const APIMethod = ({
  name,
  comment,
  returnTypeName,
  isProperty = false,
  isReturnTypeReference = false,
  exposeInSidebar = false,
  parameters = [],
  platforms = [],
}: {
  exposeInSidebar?: boolean;
  name: string;
  comment: string;
  returnTypeName: string;
  isProperty: boolean;
  isReturnTypeReference: boolean;
  platforms: ('Android' | 'iOS' | 'Web')[];
  parameters: {
    name: string;
    comment?: string;
    typeName: string;
    isReference?: boolean;
  }[];
}) => {
  const parsedParameters = parameters.map(
    param =>
      ({
        name: param.name,
        type: { name: param.typeName, type: param.isReference ? 'reference' : 'literal' },
        comment: {
          summary: [{ kind: 'text', text: param.comment }],
        },
      } as MethodParamData)
  );
  return renderMethod(
    {
      name,
      signatures: [
        {
          name,
          parameters: parsedParameters,
          comment: {
            summary: [{ kind: 'text', text: comment }],
            blockTags: platforms.map(text => ({
              tag: 'platform',
              content: [{ kind: 'text', text }],
            })),
          },
          type: { name: returnTypeName, type: isReturnTypeReference ? 'reference' : 'literal' },
        },
      ],
      kind: isProperty ? TypeDocKind.Property : TypeDocKind.Function,
    },
    { exposeInSidebar }
  );
};

const STYLES_NO_BULLET_LIST = css({
  listStyle: 'none',
  marginLeft: spacing[2],
});
