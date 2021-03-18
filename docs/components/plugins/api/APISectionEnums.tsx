import React from 'react';

import { InlineCode } from '~/components/base/code';
import { LI, UL } from '~/components/base/list';
import { H2, H3 } from '~/components/plugins/Headings';
import { DataProps } from '~/components/plugins/api/APISectionUtils';

const renderEnum = ({ name, children, comment }: any): JSX.Element => (
  <div key={`enum-definition-${name}`}>
    <H3>
      <InlineCode>{name}</InlineCode>
    </H3>
    <UL>
      {children.map((enumValue: any) => (
        <LI key={enumValue.name}>
          <InlineCode>
            {name}.{enumValue.name}
          </InlineCode>
          {comment ? ` - ${comment.shortText}` : null}
        </LI>
      ))}
    </UL>
  </div>
);

const APISectionEnums: React.FC<DataProps> = ({ data }) =>
  data ? (
    <>
      <H2 key="enums-header">Enums</H2>
      {data.map(renderEnum)}
    </>
  ) : null;

export default APISectionEnums;
