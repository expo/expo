import { CornerDownRightIcon } from '@expo/styleguide-icons';

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
  renderParams,
  resolveTypeName,
  STYLES_APIBOX,
  STYLES_APIBOX_NESTED,
  STYLES_NOT_EXPOSED_HEADER,
  TypeDocKind,
  getH3CodeWithBaseNestingLevel,
  getTagData,
  BoxSectionHeader,
} from '~/components/plugins/api/APISectionUtils';
import { H2, LI, UL, MONOSPACE } from '~/ui/components/Text';

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
  baseNestingLevel?: number;
};

export const renderMethod = (
  method: MethodDefinitionData | AccessorDefinitionData | PropData,
  { apiName, exposeInSidebar = true, ...options }: RenderMethodOptions = {}
) => {
  const signatures =
    (method as MethodDefinitionData).signatures ||
    (method as PropData)?.type?.declaration?.signatures || [
      (method as AccessorDefinitionData)?.getSignature,
    ] ||
    [];
  const baseNestingLevel = options.baseNestingLevel ?? (exposeInSidebar ? 3 : 4);
  const HeaderComponent = getH3CodeWithBaseNestingLevel(baseNestingLevel);
  return signatures.map(
    ({ name, parameters, comment, type }: MethodSignatureData | TypeSignaturesData) => {
      const returnComment = getTagData('returns', comment);
      return (
        <div
          key={`method-signature-${method.name || name}-${parameters?.length || 0}`}
          css={[STYLES_APIBOX, STYLES_APIBOX_NESTED]}>
          <APISectionDeprecationNote comment={comment} />
          <APISectionPlatformTags comment={comment} />
          <HeaderComponent tags={getTagNamesList(comment)}>
            <MONOSPACE
              weight="medium"
              css={!exposeInSidebar && STYLES_NOT_EXPOSED_HEADER}
              className="wrap-anywhere">
              {getMethodName(method as MethodDefinitionData, apiName, name, parameters)}
            </MONOSPACE>
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
              <BoxSectionHeader text="Returns" />
              <UL className="!list-none !ml-0">
                <LI>
                  <CornerDownRightIcon className="inline-block icon-sm text-icon-secondary align-middle mr-2" />
                  <APIDataType typeDefinition={type} />
                </LI>
              </UL>
              <>
                <br />
                {returnComment && <CommentTextBlock comment={{ summary: returnComment.content }} />}
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
      }) as MethodParamData
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
