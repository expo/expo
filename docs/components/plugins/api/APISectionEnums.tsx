import { mergeClasses } from '@expo/styleguide';

import { APIBoxHeader } from '~/components/plugins/api/components/APIBoxHeader';
import { H2, H4, MONOSPACE } from '~/ui/components/Text';

import { EnumDefinitionData, EnumValueData } from './APIDataTypes';
import { APISectionDeprecationNote } from './APISectionDeprecationNote';
import { APICommentTextBlock } from './components/APICommentTextBlock';
import { APISectionPlatformTags } from './components/APISectionPlatformTags';
import { STYLES_APIBOX } from './styles';

export type APISectionEnumsProps = {
  data: EnumDefinitionData[];
};

const sortByValue = (a: EnumValueData, b: EnumValueData) => {
  if (a.type?.value !== undefined && b.type?.value !== undefined) {
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
    <div key={`enum-definition-${name}`} className={mergeClasses(STYLES_APIBOX)}>
      <APISectionDeprecationNote comment={comment} sticky />
      <APIBoxHeader name={name} comment={comment} />
      <APICommentTextBlock comment={comment} includePlatforms={false} />
      {children.sort(sortByValue).map((enumValue: EnumValueData) => (
        <div
          className="border-t-palette-gray4 border-t px-4 pt-3 pb-0 [&_h4]:mb-0.5"
          key={enumValue.name}>
          <APISectionDeprecationNote comment={enumValue.comment} />
          <div className="max-md-gutters:flex-col flex flex-wrap justify-between">
            <H4 hideInSidebar className="font-medium!">
              <MONOSPACE className="text-sm! font-medium! wrap-anywhere!">
                {enumValue.name}
              </MONOSPACE>
            </H4>
            <APISectionPlatformTags comment={enumValue.comment} disableFallback className="mb-1" />
          </div>
          <MONOSPACE className="text-tertiary mb-2 inline-flex text-xs wrap-anywhere">
            {`${name}.${enumValue.name} ＝ ${renderEnumValue(
              enumValue.type.value,
              enumValue.type.name
            )}`}
          </MONOSPACE>
          <APICommentTextBlock
            comment={enumValue.comment}
            includePlatforms={false}
            includeSpacing={false}
          />
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
