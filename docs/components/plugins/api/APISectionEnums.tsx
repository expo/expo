import React from 'react';

import { InlineCode } from '~/components/base/code';
import { LI, UL } from '~/components/base/list';
import { H2, H3Code } from '~/components/plugins/Headings';
import { EnumDefinitionData, EnumValueData } from '~/components/plugins/api/APIDataTypes';
import { CommentTextBlock, mdInlineComponents } from '~/components/plugins/api/APISectionUtils';

export type APISectionEnumsProps = {
  data: EnumDefinitionData[];
};

const sortByValue = (a: EnumValueData, b: EnumValueData) => {
  if (a.defaultValue && b.defaultValue) {
    if (a.defaultValue.includes(`'`) && b.defaultValue.includes(`'`)) {
      return a.defaultValue.localeCompare(b.defaultValue);
    } else {
      return parseInt(a.defaultValue, 10) - parseInt(b.defaultValue, 10);
    }
  }
  return 0;
};

const renderEnum = ({ name, children, comment }: EnumDefinitionData): JSX.Element => (
  <div key={`enum-definition-${name}`}>
    <H3Code>
      <InlineCode>{name}</InlineCode>
    </H3Code>
    <CommentTextBlock comment={comment} />
    <UL>
      {children.sort(sortByValue).map((enumValue: EnumValueData) => (
        <LI key={enumValue.name}>
          <InlineCode>
            {name}.{enumValue.name}
          </InlineCode>
          {enumValue?.defaultValue && (
            <>
              {' : '}
              <InlineCode>{enumValue?.defaultValue}</InlineCode>
            </>
          )}
          <CommentTextBlock comment={enumValue.comment} components={mdInlineComponents} withDash />
        </LI>
      ))}
    </UL>
  </div>
);

const APISectionEnums = ({ data }: APISectionEnumsProps) =>
  data?.length ? (
    <>
      <H2 key="enums-header">Enums</H2>
      {data.map(renderEnum)}
    </>
  ) : null;

export default APISectionEnums;
