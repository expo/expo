import { MethodParamData } from './APIDataTypes';
import { renderMethod } from './APISectionMethods';
import { TypeDocKind } from './APISectionUtils';

type Props = {
  exposeInSidebar?: boolean;
  name: string;
  sdkVersion: string;
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
};

export function APIMethod({
  name,
  sdkVersion,
  comment,
  returnTypeName,
  isProperty = false,
  isReturnTypeReference = false,
  exposeInSidebar = false,
  parameters = [],
  platforms = [],
}: Props) {
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
    { sdkVersion, exposeInSidebar }
  );
}
