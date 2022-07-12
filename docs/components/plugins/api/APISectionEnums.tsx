import { css } from '@emotion/react';
import { spacing, theme } from '@expo/styleguide';
import React from 'react';

import { InlineCode } from '~/components/base/code';
import { H2, H3Code, H4Code } from '~/components/plugins/Headings';
import { EnumDefinitionData, EnumValueData } from '~/components/plugins/api/APIDataTypes';
import { PlatformTags } from '~/components/plugins/api/APISectionPlatformTags';
import { CommentTextBlock, STYLES_APIBOX } from '~/components/plugins/api/APISectionUtils';

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
  <div key={`enum-definition-${name}`} css={[STYLES_APIBOX, enumContentStyles]}>
    <H3Code>
      <InlineCode>{name}</InlineCode>
    </H3Code>
    <CommentTextBlock comment={comment} />
    {children.sort(sortByValue).map((enumValue: EnumValueData) => (
      <div css={[STYLES_APIBOX, enumContainerStyle]} key={enumValue.name}>
        <PlatformTags comment={enumValue.comment} prefix="Only for:" firstElement />
        <div css={enumValueNameStyle}>
          <H4Code>
            <InlineCode>{enumValue.name}</InlineCode>
          </H4Code>
        </div>
        <InlineCode customCss={enumValueStyles}>
          {name}.{enumValue.name}
          {enumValue?.defaultValue ? ` ＝ ${enumValue?.defaultValue}` : ''}
        </InlineCode>
        <CommentTextBlock comment={enumValue.comment} includePlatforms={false} />
      </div>
    ))}
  </div>
);

const APISectionEnums = ({ data }: APISectionEnumsProps) =>
  data?.length ? (
    <>
      <H2 key="enums-header">Enums</H2>
      {data.map(renderEnum)}
    </>
  ) : null;

const enumContainerStyle = css({
  boxShadow: 'none',
  marginBottom: spacing[3],
});

const enumValueNameStyle = css({
  marginTop: spacing[3],
});

const enumValueStyles = css({
  display: 'inline-block',
  padding: `0 ${spacing[2]}px`,
  color: theme.text.secondary,
  fontSize: '75%',
  marginBottom: spacing[3],
});

const enumContentStyles = css({
  '& blockquote': {
    margin: `${spacing[2]}px 0`,
  },

  '& ul': {
    marginBottom: 0,
  },
});

export default APISectionEnums;
