import { mergeClasses } from '@expo/styleguide';

import { H2, H4, MONOSPACE } from '~/ui/components/Text';

import { EnumDefinitionData, EnumValueData } from './APIDataTypes';
import { APISectionDeprecationNote } from './APISectionDeprecationNote';
import { getTagNamesList, H3Code } from './APISectionUtils';
import { APICommentTextBlock } from './components/APICommentTextBlock';
import { APISectionPlatformTags } from './components/APISectionPlatformTags';
import { STYLES_APIBOX } from './styles';

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

const renderEnumValue = (value: any, fallback?: string) =>
  typeof value === 'string' ? `"${value}"` : (value ?? fallback);

function APISectionEnum({ data: { name, children, comment } }: { data: EnumDefinitionData }) {
  return (
    <div key={`enum-definition-${name}`} className={mergeClasses(STYLES_APIBOX, '!p-0')}>
      <div className="min-h-[56px] px-5 pt-3">
        <APISectionDeprecationNote comment={comment} />
        <div className="flex flex-wrap items-baseline justify-between max-md-gutters:flex-col">
          <H3Code tags={getTagNamesList(comment)}>
            <MONOSPACE weight="medium" className="wrap-anywhere">
              {name}
            </MONOSPACE>
          </H3Code>
          <APISectionPlatformTags comment={comment} />
        </div>
        <APICommentTextBlock comment={comment} includePlatforms={false} />
      </div>
      {children.sort(sortByValue).map((enumValue: EnumValueData) => (
        <div
          className="border-t border-t-secondary px-5 pb-0 pt-3 [&_h4]:mb-0.5"
          key={enumValue.name}>
          <APISectionDeprecationNote comment={enumValue.comment} />
          <H4 hideInSidebar>
            <MONOSPACE className="!text-inherit !font-medium">{enumValue.name}</MONOSPACE>
          </H4>
          <APISectionPlatformTags
            comment={enumValue.comment}
            prefix="Only for:"
            className="mb-1"
            disableFallback
          />
          <MONOSPACE theme="tertiary" className="mb-2 inline-flex text-2xs">
            {`${name}.${enumValue.name} ＝ ${renderEnumValue(
              enumValue.type.value,
              enumValue.type.name
            )}`}
          </MONOSPACE>
          <APICommentTextBlock comment={enumValue.comment} includePlatforms={false} />
        </div>
      ))}
    </div>
  );
}

const APISectionEnums = ({ data }: APISectionEnumsProps) =>
  data?.length ? (
    <>
      <H2 key="enums-header">Enums</H2>
      {data.map(enumData => (
        <APISectionEnum key={enumData.name} data={enumData} />
      ))}
    </>
  ) : null;

export default APISectionEnums;
