import { mergeClasses } from '@expo/styleguide';
import { BracketsEllipsesDuotoneIcon } from '@expo/styleguide-icons/duotone/BracketsEllipsesDuotoneIcon';
import { CornerDownRightIcon } from '@expo/styleguide-icons/outline/CornerDownRightIcon';

import { APIBoxHeader } from '~/components/plugins/api/components/APIBoxHeader';
import { APIMethodParamRows } from '~/components/plugins/api/components/APIMethodParamRows';
import { H2 } from '~/ui/components/Text';

import {
  AccessorDefinitionData,
  CommentContentData,
  CommentData,
  CommentTagData,
  MethodDefinitionData,
  MethodParamData,
  MethodSignatureData,
  PropData,
  TypeDefinitionData,
} from './APIDataTypes';
import { APISectionDeprecationNote } from './APISectionDeprecationNote';
import { getMethodName, resolveTypeName, getTagData, getAllTagData } from './APISectionUtils';
import { APICommentTextBlock } from './components/APICommentTextBlock';
import { APIDataType } from './components/APIDataType';
import { ELEMENT_SPACING, STYLES_APIBOX, STYLES_APIBOX_NESTED, STYLES_SECONDARY } from './styles';

export type APISectionMethodsProps = {
  data: (MethodDefinitionData | PropData)[];
  sdkVersion: string;
  apiName?: string;
  header?: string;
  exposeInSidebar?: boolean;
};

export type RenderMethodOptions = {
  apiName?: string;
  sdkVersion: string;
  header?: string;
  nested?: boolean;
  exposeInSidebar?: boolean;
  baseNestingLevel?: number;
  parentPlatforms?: CommentTagData[];
};

const CONFIG_PLUGIN_NAME = 'ConfigPlugin';

const isConfigPluginReference = (type?: TypeDefinitionData) =>
  type?.type === 'reference' &&
  type.name === CONFIG_PLUGIN_NAME &&
  (!type.target?.qualifiedName || type.target?.qualifiedName === CONFIG_PLUGIN_NAME);

const getParamTagContent = (comment: CommentData | undefined, paramName: string) =>
  comment?.blockTags?.find(tag => tag.tag === '@param' && tag.name === paramName)?.content;

const toParamComment = (content?: CommentContentData[]): CommentData | undefined =>
  content ? { summary: content } : undefined;

const expoConfigType: TypeDefinitionData = {
  type: 'reference',
  name: 'ExpoConfig',
  package: '@expo/config-types',
};

const getConfigPluginSignatures = (method: PropData): MethodSignatureData[] => {
  if (!isConfigPluginReference(method.type)) {
    return [];
  }

  const comment = method.comment ?? { summary: [] };
  const propsType = method.type?.typeArguments?.[0];
  const propsComment = toParamComment(getParamTagContent(method.comment, 'props'));

  const parameters: MethodParamData[] = [
    {
      name: 'config',
      type: expoConfigType,
      comment: toParamComment(getParamTagContent(method.comment, 'config')),
    },
  ];

  if (propsType || propsComment) {
    parameters.push({
      name: 'props',
      type: propsType ?? { type: 'intrinsic', name: 'void' },
      comment: propsComment,
    });
  }

  return [
    {
      name: method.name ?? '',
      parameters,
      comment,
      type: expoConfigType,
    },
  ];
};

function getMethodRootSignatures(method: MethodDefinitionData | AccessorDefinitionData | PropData) {
  if ('signatures' in method) {
    return method.signatures ?? [];
  }
  if ('getSignature' in method) {
    return method.getSignature ? [method.getSignature] : [];
  }
  if ('type' in method) {
    if (method?.type?.declaration?.signatures) {
      if (method.type.declaration.name === '__type') {
        return method.type.declaration.signatures.map(signature => ({
          ...signature,
          comment: method.comment,
        }));
      }
      return method.type.declaration.signatures ?? [];
    }
    return getConfigPluginSignatures(method);
  }
  return [];
}

export const renderMethod = (
  method: MethodDefinitionData | AccessorDefinitionData | PropData,
  {
    apiName,
    exposeInSidebar = true,
    nested = false,
    sdkVersion,
    parentPlatforms,
    ...options
  }: RenderMethodOptions
) => {
  const signatures = getMethodRootSignatures(method);
  const baseNestingLevel = options.baseNestingLevel ?? (exposeInSidebar ? 3 : 4);
  const hasOverloads = signatures.length > 1;

  return signatures.map(({ name, parameters, comment, type, typeParameter }, overloadIndex) => {
    const returnComment = getTagData('returns', comment);
    const platforms = getAllTagData('platform', comment);
    return (
      <div
        key={`method-signature-${method.name || name}-${parameters?.length ?? 0}`}
        className={mergeClasses(
          !nested && STYLES_APIBOX,
          !nested && STYLES_APIBOX_NESTED,
          nested && 'border-b border-palette-gray4 last:border-b-0'
        )}>
        <APISectionDeprecationNote comment={comment} sticky className="!rounded-t-none" />
        <APIBoxHeader
          name={getMethodName(
            method as MethodDefinitionData,
            apiName,
            name,
            parameters,
            typeParameter
          )}
          platforms={platforms.length > 0 ? platforms : parentPlatforms}
          baseNestingLevel={baseNestingLevel}
          // only show first overload in sidebar to avoid duplicates
          hideInSidebar={overloadIndex > 0}
          tags={hasOverloads ? ['overload'] : undefined}
        />
        {hasOverloads && (
          <div className="px-4 pb-2 text-tertiary">
            <BracketsEllipsesDuotoneIcon className="icon-xs mr-1 inline shrink-0" />
            <span className="text-3xs">Overload #{overloadIndex + 1}</span>
          </div>
        )}
        {parameters && parameters.length > 0 && (
          <>
            <APIMethodParamRows parameters={parameters} sdkVersion={sdkVersion} />
            <br />
          </>
        )}
        <APICommentTextBlock
          comment={method?.comment ?? comment}
          includePlatforms={false}
          afterContent={
            type && resolveTypeName(type, sdkVersion) !== 'undefined' ? (
              <>
                <div
                  className={mergeClasses(
                    'flex flex-row items-start gap-2',
                    !returnComment && getAllTagData('example', comment) && ELEMENT_SPACING
                  )}>
                  <div className="flex flex-row items-center gap-2">
                    <CornerDownRightIcon className="icon-sm relative -mt-0.5 inline-block text-icon-tertiary" />
                    <span className={STYLES_SECONDARY}>Returns:</span>
                  </div>
                  <APIDataType typeDefinition={type} sdkVersion={sdkVersion} />
                </div>
                {returnComment ? (
                  <div className="mb-1 mt-1.5 flex flex-col pl-6">
                    <APICommentTextBlock
                      comment={{ summary: returnComment.content }}
                      includeSpacing={false}
                    />
                  </div>
                ) : undefined}
              </>
            ) : undefined
          }
        />
      </div>
    );
  });
};

const APISectionMethods = ({
  data,
  sdkVersion,
  apiName,
  header = 'Methods',
  exposeInSidebar = true,
}: APISectionMethodsProps) =>
  data?.length ? (
    <>
      <H2 key={`${header}-header`}>{header}</H2>
      {data.map((method: MethodDefinitionData | PropData) =>
        renderMethod(method, { apiName, sdkVersion, header, exposeInSidebar })
      )}
    </>
  ) : null;

export default APISectionMethods;
