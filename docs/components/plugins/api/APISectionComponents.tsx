import { mergeClasses } from '@expo/styleguide';

import { hardcodedTypeLinks } from '~/components/plugins/api/APIStaticData';
import { APIBoxHeader } from '~/components/plugins/api/components/APIBoxHeader';
import { H2, DEMI, CODE, CALLOUT, A } from '~/ui/components/Text';

import {
  CommentData,
  GeneratedData,
  MethodSignatureData,
  PropsDefinitionData,
} from './APIDataTypes';
import { APISectionDeprecationNote } from './APISectionDeprecationNote';
import APISectionProps from './APISectionProps';
import {
  resolveTypeName,
  getComponentName,
  getPossibleComponentPropsNames,
  getAllTagData,
} from './APISectionUtils';
import { APICommentTextBlock } from './components/APICommentTextBlock';
import { ELEMENT_SPACING, STYLES_APIBOX, STYLES_SECONDARY, VERTICAL_SPACING } from './styles';

export type APISectionComponentsProps = {
  data: GeneratedData[];
  sdkVersion: string;
  componentsProps: PropsDefinitionData[];
};

const getComponentComment = (comment: CommentData, signatures: MethodSignatureData[]) =>
  comment || (signatures?.[0]?.comment ?? undefined);

const getComponentType = ({ signatures }: Partial<GeneratedData>) => {
  if (signatures?.length && signatures[0].type.types) {
    return 'React.' + signatures[0].type.types.filter(t => t.type === 'reference')[0]?.name;
  }
  return (
    <>
      React.
      <A href={hardcodedTypeLinks.Element}>Element</A>
    </>
  );
};

const getComponentTypeParameters = ({
  extendedTypes,
  type,
  signatures,
}: Partial<GeneratedData>) => {
  if (extendedTypes?.length) {
    return extendedTypes[0];
  } else if (signatures?.length && signatures[0]?.parameters?.length) {
    return signatures?.[0].parameters[0].type;
  }
  return type;
};

const renderComponent = (
  { name, comment, type, extendedTypes, children, signatures }: GeneratedData,
  sdkVersion: string,
  componentsProps?: PropsDefinitionData[]
) => {
  const resolvedType = getComponentType({ signatures });
  const resolvedTypeParameters = getComponentTypeParameters({ type, extendedTypes, signatures });
  const resolvedName = getComponentName(name, children);
  const extractedComment = getComponentComment(comment, signatures);

  return (
    <div
      key={`component-definition-${resolvedName}`}
      className={mergeClasses(STYLES_APIBOX, '!shadow-none')}>
      <APISectionDeprecationNote comment={extractedComment} sticky />
      <APIBoxHeader name={resolvedName} comment={extractedComment} />
      {resolvedType && resolvedTypeParameters && (
        <CALLOUT className={mergeClasses(ELEMENT_SPACING, VERTICAL_SPACING)}>
          <DEMI className={STYLES_SECONDARY}>Type:</DEMI>{' '}
          <CODE>
            {extendedTypes ? (
              <>React.{resolveTypeName(resolvedTypeParameters, sdkVersion)}</>
            ) : (
              <>
                {resolvedType}
                <span className="text-quaternary">&lt;</span>
                {resolveTypeName(resolvedTypeParameters, sdkVersion)}
                <span className="text-quaternary">&gt;</span>
              </>
            )}
          </CODE>
        </CALLOUT>
      )}
      <APICommentTextBlock comment={extractedComment} includePlatforms={false} />
      {componentsProps?.length ? (
        <APISectionProps
          sdkVersion={sdkVersion}
          data={componentsProps}
          header={`${resolvedName}Props`}
          parentPlatforms={getAllTagData('platform', extractedComment)}
        />
      ) : null}
    </div>
  );
};

const APISectionComponents = ({ data, sdkVersion, componentsProps }: APISectionComponentsProps) =>
  data?.length ? (
    <>
      <H2 key="components-header">{data.length === 1 ? 'Component' : 'Components'}</H2>
      {data.map(component =>
        renderComponent(
          component,
          sdkVersion,
          componentsProps.filter(cp =>
            getPossibleComponentPropsNames(component.name, component.children).includes(cp.name)
          )
        )
      )}
    </>
  ) : null;

export default APISectionComponents;
