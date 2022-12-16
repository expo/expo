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
import { H2, BOLD, P, CODE } from '~/ui/components/Text';

export type APISectionComponentsProps = {
  data: GeneratedData[];
  componentsProps: PropsDefinitionData[];
};

const getComponentComment = (comment: CommentData, signatures: MethodSignatureData[]) =>
  comment || (signatures?.[0]?.comment ?? undefined);

const renderComponent = (
  { name, comment, type, extendedTypes, children, signatures }: GeneratedData,
  componentsProps?: PropsDefinitionData[]
): JSX.Element => {
  const resolvedType = extendedTypes?.length ? extendedTypes[0] : type;
  const resolvedName = getComponentName(name, children);
  const extractedComment = getComponentComment(comment, signatures);
  return (
    <div key={`component-definition-${resolvedName}`} css={STYLES_APIBOX}>
      <APISectionDeprecationNote comment={extractedComment} />
      <H3Code tags={getTagNamesList(comment)}>
        <CODE>{resolvedName}</CODE>
      </H3Code>
      {resolvedType && (
        <P>
          <BOLD>Type:</BOLD> <CODE>{resolveTypeName(resolvedType)}</CODE>
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
