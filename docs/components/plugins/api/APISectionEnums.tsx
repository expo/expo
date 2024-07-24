import { EnumDefinitionData, EnumValueData } from '~/components/plugins/api/APIDataTypes';
import { APISectionDeprecationNote } from '~/components/plugins/api/APISectionDeprecationNote';
import { APISectionPlatformTags } from '~/components/plugins/api/APISectionPlatformTags';
import {
  CommentTextBlock,
  getTagNamesList,
  STYLES_APIBOX,
  H3Code,
  BoxSectionHeader,
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

const renderEnumValue = (value: any, fallback?: string) =>
  typeof value === 'string' ? `"${value}"` : value ?? fallback;

function APISectionEnum({ data: { name, children, comment } }: { data: EnumDefinitionData }) {
  return (
    <div key={`enum-definition-${name}`} css={STYLES_APIBOX} className="!p-0">
      <div className="px-5 pt-4">
        <APISectionDeprecationNote comment={comment} />
        <APISectionPlatformTags comment={comment} />
        <H3Code tags={getTagNamesList(comment)}>
          <MONOSPACE weight="medium" className="wrap-anywhere">
            {name}
          </MONOSPACE>
        </H3Code>
        <CommentTextBlock comment={comment} includePlatforms={false} />
        <BoxSectionHeader text={`${name} Values`} className="!mb-0 !border-b-0" />
      </div>
      {children.sort(sortByValue).map((enumValue: EnumValueData) => (
        <div className="border-t border-t-secondary p-5 pb-0 pt-4" key={enumValue.name}>
          <APISectionDeprecationNote comment={enumValue.comment} />
          <APISectionPlatformTags comment={enumValue.comment} prefix="Only for:" disableFallback />
          <H4 className="!mt-0" hideInSidebar>
            <MONOSPACE className="!text-inherit">{enumValue.name}</MONOSPACE>
          </H4>
          <CODE theme="secondary" className="mb-3">
            {`${name}.${enumValue.name} ＝ ${renderEnumValue(
              enumValue.type.value,
              enumValue.type.name
            )}`}
          </CODE>
          <CommentTextBlock comment={enumValue.comment} includePlatforms={false} />
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
