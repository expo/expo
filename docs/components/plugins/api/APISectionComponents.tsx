import React from 'react';

import { InlineCode } from '~/components/base/code';
import { B, P } from '~/components/base/paragraph';
import { H2, H3Code } from '~/components/plugins/Headings';
import { GeneratedData, PropsDefinitionData } from '~/components/plugins/api/APIDataTypes';
import APISectionProps from '~/components/plugins/api/APISectionProps';
import { CommentTextBlock, resolveTypeName } from '~/components/plugins/api/APISectionUtils';

export type APISectionComponentsProps = {
  data: GeneratedData[];
  componentsProps: PropsDefinitionData[];
};

const renderComponent = (
  { name, comment, type, extendedTypes }: GeneratedData,
  componentsProps?: PropsDefinitionData[]
): JSX.Element => {
  const finalType = extendedTypes?.length ? extendedTypes[0] : type;
  return (
    <div key={`component-definition-${name}`}>
      <H3Code>
        <InlineCode>{name}</InlineCode>
      </H3Code>
      {finalType && (
        <P>
          <B>Type:</B> <InlineCode>{resolveTypeName(finalType)}</InlineCode>
        </P>
      )}
      <CommentTextBlock comment={comment} />
      {componentsProps && componentsProps.length ? (
        <APISectionProps data={componentsProps} header={`${name}Props`} />
      ) : null}
    </div>
  );
};

const APISectionComponents = ({ data, componentsProps }: APISectionComponentsProps) =>
  data?.length ? (
    <>
      <H2 key="components-header">Components</H2>
      {data.map(component =>
        renderComponent(
          component,
          componentsProps.filter(cp => cp.name.includes(component.name))
        )
      )}
    </>
  ) : null;

export default APISectionComponents;
