import { mergeClasses } from '@expo/styleguide';
import { CornerDownRightIcon } from '@expo/styleguide-icons/outline/CornerDownRightIcon';

import { APIBoxHeader } from '~/components/plugins/api/components/APIBoxHeader';
import { H2 } from '~/ui/components/Text';

import { AccessorDefinitionData, MethodDefinitionData, PropData } from './APIDataTypes';
import { APISectionDeprecationNote } from './APISectionDeprecationNote';
import {
  getMethodName,
  renderParams,
  resolveTypeName,
  getTagData,
  getAllTagData,
} from './APISectionUtils';
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
  }
  return [];
}

export const renderMethod = (
  method: MethodDefinitionData | AccessorDefinitionData | PropData,
  { apiName, exposeInSidebar = true, nested = false, sdkVersion, ...options }: RenderMethodOptions
) => {
  const signatures = getMethodRootSignatures(method);
  const baseNestingLevel = options.baseNestingLevel ?? (exposeInSidebar ? 3 : 4);

  return signatures.map(({ name, parameters, comment, type, typeParameter }) => {
    const returnComment = getTagData('returns', comment);
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
          comment={comment}
          baseNestingLevel={baseNestingLevel}
        />
        {parameters && parameters.length > 0 && (
          <>
            {renderParams(parameters, sdkVersion)}
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
        {}
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
