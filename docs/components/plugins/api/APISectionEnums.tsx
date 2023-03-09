import { css } from '@emotion/react';
import { spacing, theme } from '@expo/styleguide';

import { EnumDefinitionData, EnumValueData } from '~/components/plugins/api/APIDataTypes';
import { APISectionDeprecationNote } from '~/components/plugins/api/APISectionDeprecationNote';
import { APISectionPlatformTags } from '~/components/plugins/api/APISectionPlatformTags';
import {
  CommentTextBlock,
  getTagNamesList,
  STYLES_APIBOX,
  STYLES_APIBOX_NESTED,
  H3Code,
} from '~/components/plugins/api/APISectionUtils';
import { H2, H4, CODE, MONOSPACE } from '~/ui/components/Text';

export type APISectionEnumsProps = {
  data: EnumDefinitionData[];
};

const sortByValue = (a: EnumValueData, b: EnumValueData) => {
  if (a.type && a.type.value !== undefined && b.type && b.type.value !== undefined) {
    if (typeof a.type.value === 'string' && typeof b.type.value === 'string') {
      return a.type.value.localeCompare(b.type.value);
    } else if (typeof a.type.value === 'number' && typeof b.type.value === 'number') {
      return (a.type.value ?? Number.MIN_VALUE) - (b.type.value ?? Number.MIN_VALUE);
    }
  }
  return 0;
};

const renderEnumValue = (value: any) => (typeof value === 'string' ? `"${value}"` : value);

const renderEnum = ({ name, children, comment }: EnumDefinitionData): JSX.Element => (
  <div key={`enum-definition-${name}`} css={[STYLES_APIBOX, enumContentStyles]}>
    <APISectionDeprecationNote comment={comment} />
    <APISectionPlatformTags comment={comment} prefix="Only for:" />
    <H3Code tags={getTagNamesList(comment)}>
      <MONOSPACE weight="medium">{name}</MONOSPACE>
    </H3Code>
    <CommentTextBlock comment={comment} includePlatforms={false} />
    {children.sort(sortByValue).map((enumValue: EnumValueData) => (
      <div css={[STYLES_APIBOX, STYLES_APIBOX_NESTED]} key={enumValue.name}>
        <APISectionDeprecationNote comment={enumValue.comment} />
        <APISectionPlatformTags comment={enumValue.comment} prefix="Only for:" />
        <H4 css={enumValueNameStyle}>
          <CODE>{enumValue.name}</CODE>
        </H4>
        <CODE css={enumValueStyles}>
          {`${name}.${enumValue.name} ＝ ${renderEnumValue(enumValue.type.value)}`}
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
