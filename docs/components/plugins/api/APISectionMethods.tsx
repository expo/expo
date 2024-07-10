import { mergeClasses } from '@expo/styleguide';
import { CornerDownRightIcon } from '@expo/styleguide-icons/outline/CornerDownRightIcon';

import { APIDataType } from '~/components/plugins/api/APIDataType';
import {
  AccessorDefinitionData,
  MethodDefinitionData,
  PropData,
} from '~/components/plugins/api/APIDataTypes';
import { APISectionDeprecationNote } from '~/components/plugins/api/APISectionDeprecationNote';
import { APISectionPlatformTags } from '~/components/plugins/api/APISectionPlatformTags';
import {
  CommentTextBlock,
  getMethodName,
  renderParams,
  resolveTypeName,
  STYLES_APIBOX,
  STYLES_APIBOX_NESTED,
  STYLES_NOT_EXPOSED_HEADER,
  getH3CodeWithBaseNestingLevel,
  getTagData,
  getAllTagData,
} from '~/components/plugins/api/APISectionUtils';
import { ELEMENT_SPACING } from '~/components/plugins/api/styles';
import { CALLOUT, H2, MONOSPACE } from '~/ui/components/Text';

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
  { apiName, exposeInSidebar = true, sdkVersion, ...options }: RenderMethodOptions
) => {
  const signatures = getMethodRootSignatures(method);
  const baseNestingLevel = options.baseNestingLevel ?? (exposeInSidebar ? 3 : 4);
  const HeaderComponent = getH3CodeWithBaseNestingLevel(baseNestingLevel);
  return signatures.map(({ name, parameters, comment, type, typeParameter }) => {
    const returnComment = getTagData('returns', comment);
    return (
      <div
        key={`method-signature-${method.name || name}-${parameters?.length || 0}`}
        css={[STYLES_APIBOX, STYLES_APIBOX_NESTED]}>
        <APISectionDeprecationNote comment={comment} sticky />
        <APISectionPlatformTags comment={comment} />
        <HeaderComponent>
          <MONOSPACE
            weight="medium"
            css={!exposeInSidebar && STYLES_NOT_EXPOSED_HEADER}
            className="wrap-anywhere">
            {getMethodName(
              method as MethodDefinitionData,
              apiName,
              name,
              parameters,
              typeParameter
            )}
          </MONOSPACE>
        </HeaderComponent>
        {parameters && parameters.length > 0 && (
          <>
            {renderParams(parameters, sdkVersion)}
            <br />
          </>
        )}
        <CommentTextBlock
          comment={comment}
          includePlatforms={false}
          afterContent={
            type && resolveTypeName(type, sdkVersion) !== 'undefined' ? (
              <>
                <div
                  className={mergeClasses(
                    'flex flex-row gap-2 items-start',
                    !returnComment && getAllTagData('example', comment) && ELEMENT_SPACING
                  )}>
                  <div className="flex flex-row gap-2 items-center">
                    <CornerDownRightIcon className="inline-block icon-sm text-icon-secondary" />
                    <CALLOUT tag="span" theme="secondary" weight="medium">
                      Returns:
                    </CALLOUT>
                  </div>
                  <CALLOUT>
                    <APIDataType typeDefinition={type} sdkVersion={sdkVersion} />
                  </CALLOUT>
                </div>
                {returnComment ? (
                  <div className="flex flex-col mt-1.5 mb-1 pl-6">
                    <CommentTextBlock comment={{ summary: returnComment.content }} />
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
