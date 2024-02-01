import { ELEMENT_SPACING } from './styles';

import {
  CommentData,
  GeneratedData,
  MethodSignatureData,
  PropsDefinitionData,
} from '~/components/plugins/api/APIDataTypes';
import { APISectionDeprecationNote } from '~/components/plugins/api/APISectionDeprecationNote';
import APISectionProps from '~/components/plugins/api/APISectionProps';
import {
  CommentTextBlock,
  resolveTypeName,
  getComponentName,
  STYLES_APIBOX,
  getTagNamesList,
  H3Code,
} from '~/components/plugins/api/APISectionUtils';
import { H2, DEMI, P, CODE, MONOSPACE } from '~/ui/components/Text';

export type APISectionComponentsProps = {
  data: GeneratedData[];
  componentsProps: PropsDefinitionData[];
};

const getComponentComment = (comment: CommentData, signatures: MethodSignatureData[]) =>
  comment || (signatures?.[0]?.comment ?? undefined);

const getComponentType = ({ signatures }: Partial<GeneratedData>) => {
  if (signatures?.length && signatures[0].type.types) {
    return 'React.' + signatures[0].type.types.filter(t => t.type === 'reference')[0]?.name;
  }
  return 'React.Element';
};

const getComponentTypeParameters = ({
  extendedTypes,
  type,
  signatures,
}: Partial<GeneratedData>) => {
  if (extendedTypes?.length) {
    return extendedTypes[0];
  } else if (signatures?.length && signatures[0].parameters.length) {
    return signatures?.[0].parameters[0].type;
  }
  return type;
};

const renderComponent = (
  { name, comment, type, extendedTypes, children, signatures }: GeneratedData,
  componentsProps?: PropsDefinitionData[]
): JSX.Element => {
  const resolvedType = getComponentType({ signatures });
  const resolvedTypeParameters = getComponentTypeParameters({ type, extendedTypes, signatures });
  const resolvedName = getComponentName(name, children);
  const extractedComment = getComponentComment(comment, signatures);
  return (
    <div key={`component-definition-${resolvedName}`} css={STYLES_APIBOX}>
      <APISectionDeprecationNote comment={extractedComment} />
      <H3Code tags={getTagNamesList(comment)}>
        <MONOSPACE weight="medium" className="wrap-anywhere">
          {resolvedName}
        </MONOSPACE>
      </H3Code>
      {resolvedType && resolvedTypeParameters && (
        <P className={ELEMENT_SPACING}>
          <DEMI theme="secondary">Type:</DEMI>{' '}
          <CODE>
            {extendedTypes ? (
              <>React.{resolveTypeName(resolvedTypeParameters)}</>
            ) : (
              <>
                {resolvedType}&lt;{resolveTypeName(resolvedTypeParameters)}&gt;
              </>
            )}
          </CODE>
        </P>
      )}
      <CommentTextBlock comment={extractedComment} />
      {componentsProps && componentsProps.length ? (
        <APISectionProps
          data={componentsProps}
          header={componentsProps.length === 1 ? 'Props' : `${resolvedName}Props`}
        />
      ) : null}
    </div>
  );
};

const APISectionComponents = ({ data, componentsProps }: APISectionComponentsProps) =>
  data?.length ? (
    <>
      <H2 key="components-header">{data.length === 1 ? 'Component' : 'Components'}</H2>
      {data.map(component =>
        renderComponent(
          component,
          componentsProps.filter(cp =>
            cp.name.includes(getComponentName(component.name, component.children))
          )
        )
      )}
    </>
  ) : null;

export default APISectionComponents;
