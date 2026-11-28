import {
  MethodSignatureData,
  TypeDefinitionData,
  TypeSignaturesData,
} from '~/components/plugins/api/APIDataTypes';
import { resolveTypeName } from '~/components/plugins/api/APISectionUtils';
import { APIDataType } from '~/components/plugins/api/components/APIDataType';
import {
  APITypePopover,
  getNodeText,
  isLongType,
} from '~/components/plugins/api/components/APITypePopover';
import { CODE } from '~/ui/components/Text';

type Props = {
  type?: TypeDefinitionData;
  signatures?: MethodSignatureData[] | TypeSignaturesData[];
  allowBlock?: boolean;
  collapsible?: boolean;
  sdkVersion: string;
};

export const APITypeOrSignatureType = ({
  type,
  signatures,
  allowBlock = false,
  collapsible = false,
  sdkVersion,
}: Props) => {
  if (signatures?.length) {
    const signature = (
      <CODE key={`signature-type-${signatures[0].name}`} data-md="type-sig">
        <span className="text-quaternary">(</span>
        {signatures?.map(({ parameters }) =>
          parameters?.map((param, index) => (
            <span key={`signature-param-${param.name}`}>
              {param.name}
              {param.flags?.isOptional && '?'}
              <span className="text-quaternary">:</span> {resolveTypeName(param.type, sdkVersion)}
              {parameters?.length !== index + 1 ? <span className="text-quaternary">, </span> : ''}
            </span>
          ))
        )}
        <span className="text-quaternary">{') =>'}</span>{' '}
        {signatures[0].type ? resolveTypeName(signatures[0].type, sdkVersion) : 'void'}
      </CODE>
    );
    const text = getNodeText(signature);
    return collapsible && isLongType(text) ? (
      <APITypePopover text={text}>{signature}</APITypePopover>
    ) : (
      signature
    );
  } else if (type) {
    if (allowBlock) {
      return (
        <APIDataType typeDefinition={type} sdkVersion={sdkVersion} collapsible={collapsible} />
      );
    }

    return (
      <CODE key={`signature-type-${type.name}`} data-md="type-sig">
        {resolveTypeName(type, sdkVersion)}
      </CODE>
    );
  }
  return undefined;
};
