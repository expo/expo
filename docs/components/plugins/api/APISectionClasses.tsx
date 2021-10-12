import React from 'react';

import { InlineCode } from '~/components/base/code';
import { UL } from '~/components/base/list';
import { B, P } from '~/components/base/paragraph';
import { H2, H4 } from '~/components/plugins/Headings';
import {
  ClassDefinitionData,
  GeneratedData,
  PropData,
} from '~/components/plugins/api/APIDataTypes';
import { renderMethod } from '~/components/plugins/api/APISectionMethods';
import { renderProp } from '~/components/plugins/api/APISectionProps';
import {
  CommentTextBlock,
  resolveTypeName,
  TypeDocKind,
} from '~/components/plugins/api/APISectionUtils';

export type APISectionClassesProps = {
  data: GeneratedData[];
};

const renderProperty = (prop: PropData) => {
  return prop.signatures?.length ? renderMethod(prop) : renderProp(prop, prop?.defaultValue, true);
};

const renderClass = (
  { name, comment, type, extendedTypes, children }: ClassDefinitionData,
  classCount: number
): JSX.Element => {
  const properties = children?.filter(
    child => child.kind === TypeDocKind.Property && !child.overwrites
  );
  const methods = children?.filter(child => child.kind === TypeDocKind.Method && !child.overwrites);
  return (
    <div key={`class-definition-${name}`}>
      <H2>{name}</H2>
      {extendedTypes?.length && (
        <P>
          <B>Type: </B>
          {type ? <InlineCode>{resolveTypeName(type)}</InlineCode> : 'Class'}
          <span> extends </span>
          <InlineCode>{resolveTypeName(extendedTypes[0])}</InlineCode>
        </P>
      )}
      <CommentTextBlock comment={comment} />
      {properties?.length ? (
        <>
          {classCount === 1 ? <H2>{name} Properties</H2> : <H4>{name} Properties</H4>}
          <UL>{properties.map(renderProperty)}</UL>
        </>
      ) : null}
      {methods?.length ? (
        <>
          {classCount === 1 ? <H2>{name} Methods</H2> : <H4>{name} Methods</H4>}
          <>{methods.map(renderProperty)}</>
        </>
      ) : null}
    </div>
  );
};

const APISectionClasses = ({ data }: APISectionClassesProps) =>
  data?.length ? <>{data.map(cls => renderClass(cls, data?.length))}</> : null;

export default APISectionClasses;
