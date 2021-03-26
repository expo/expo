import React from 'react';
import ReactMarkdown from 'react-markdown';

import { InlineCode } from '~/components/base/code';
import { LI, UL } from '~/components/base/list';
import { B } from '~/components/base/paragraph';
import { H2, H4 } from '~/components/plugins/Headings';
import {
  CommentData,
  inlineRenderers,
  resolveTypeName,
  TypeDefinitionData,
} from '~/components/plugins/api/APISectionUtils';

export type APISectionPropsProps = {
  data: PropsDefinition[];
  defaultProps?: any;
};

type PropsDefinition = {
  name: string;
  type: {
    types: any;
  };
};

type PropData = {
  name: string;
  comment: CommentData;
  type: TypeDefinitionData;
};

const UNKNOWN_VALUE = '...';

const extractDefaultPropValue = ({ comment, name }: PropData, defaultProps: any): string => {
  const annotationDefault = comment?.tags?.filter((tag: any) => tag.tag === 'default');
  if (annotationDefault?.length) {
    return annotationDefault[0].text;
  }
  return defaultProps?.type?.declaration?.children?.filter(
    (defaultProp: any) => defaultProp.name === name
  )[0]?.defaultValue;
};

const renderInheritedProp = (ip: any) => {
  const component = ip?.typeArguments[0].queryType?.name;
  return component ? (
    <LI key={`inherited-prop-${component}`}>
      <InlineCode>{component}</InlineCode>
    </LI>
  ) : null;
};

const renderInheritedProps = (data: any[]): JSX.Element | undefined => {
  const inheritedProps = data.filter((ip: any) => ip.type === 'reference');
  if (inheritedProps.length) {
    return (
      <div>
        <H4>Inherited Props</H4>
        <UL>{inheritedProps.map(renderInheritedProp)}</UL>
      </div>
    );
  }
  return undefined;
};

const renderProps = ({ name, type }: PropsDefinition, defaultValues: any): JSX.Element => {
  const props = type.types.filter((e: any) => e.declaration);
  return (
    <div key={`props-definition-${name}`}>
      <UL>
        {props?.map((def: any) =>
          def.declaration?.children.map((prop: PropData) =>
            renderProp(prop, extractDefaultPropValue(prop, defaultValues))
          )
        )}
      </UL>
      {renderInheritedProps(type.types)}
    </div>
  );
};

const renderProp = ({ comment, name, type }: PropData, defaultValue: string) => (
  <LI key={`prop-entry-${name}`}>
    <B>
      {name} (<InlineCode>{resolveTypeName(type)}</InlineCode>)
    </B>
    {comment?.shortText ? (
      <span>
        {' - '}
        <ReactMarkdown renderers={inlineRenderers}>{comment.shortText}</ReactMarkdown>
      </span>
    ) : null}
    {defaultValue && defaultValue !== UNKNOWN_VALUE ? (
      <span>
        {' Default: '}
        <InlineCode>{defaultValue}</InlineCode>
      </span>
    ) : null}
  </LI>
);

const APISectionProps: React.FC<APISectionPropsProps> = ({ data, defaultProps }) =>
  data?.length ? (
    <>
      <H2 key="props-header">Props</H2>
      {data.map((propsDefinition: PropsDefinition) => renderProps(propsDefinition, defaultProps))}
    </>
  ) : null;

export default APISectionProps;
