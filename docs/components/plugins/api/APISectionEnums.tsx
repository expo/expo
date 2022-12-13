import { css } from '@emotion/react';
import { spacing, theme } from '@expo/styleguide';

import { H2, H3Code, H4Code } from '~/components/plugins/Headings';
import { EnumDefinitionData, EnumValueData } from '~/components/plugins/api/APIDataTypes';
import { APISectionDeprecationNote } from '~/components/plugins/api/APISectionDeprecationNote';
import { APISectionPlatformTags } from '~/components/plugins/api/APISectionPlatformTags';
import {
  CommentTextBlock,
  getTagNamesList,
  STYLES_APIBOX,
  STYLES_APIBOX_NESTED,
} from '~/components/plugins/api/APISectionUtils';
import { CODE } from '~/ui/components/Text';

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
    <APISectionDeprecationNote comment={comment} />
    <APISectionPlatformTags comment={comment} prefix="Only for:" />
    <H3Code tags={getTagNamesList(comment)}>
      <CODE>{name}</CODE>
    </H3Code>
    <CommentTextBlock comment={comment} includePlatforms={false} />
    {children.sort(sortByValue).map((enumValue: EnumValueData) => (
      <div css={[STYLES_APIBOX, STYLES_APIBOX_NESTED]} key={enumValue.name}>
        <APISectionPlatformTags comment={enumValue.comment} prefix="Only for:" />
        <div css={enumValueNameStyle}>
          <H4Code>
            <CODE>{enumValue.name}</CODE>
          </H4Code>
        </div>
        <CODE css={enumValueStyles}>
          {name}.{enumValue.name}
          {enumValue?.defaultValue ? ` ＝ ${enumValue?.defaultValue}` : ''}
        </CODE>
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

const enumValueNameStyle = css({
  h4: {
    marginTop: 0,
  },
});

const enumValueStyles = css({
  display: 'inline-block',
  padding: `0 ${spacing[2]}px`,
  color: theme.text.secondary,
  fontSize: '75%',
  marginBottom: spacing[4],
});

const enumContentStyles = css({
  paddingBottom: 0,
});

export default APISectionEnums;
