import React from 'react';

import { InlineCode } from '~/components/base/code';
import { B, P } from '~/components/base/paragraph';
import { H2, H3Code, H4 } from '~/components/plugins/Headings';
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
  STYLES_APIBOX,
  STYLES_NESTED_SECTION_HEADER,
  TypeDocKind,
} from '~/components/plugins/api/APISectionUtils';

export type APISectionClassesProps = {
  data: GeneratedData[];
};

const isProp = (child: PropData) =>
  child.kind === TypeDocKind.Property &&
  !child.overwrites &&
  !child.name.startsWith('_') &&
  !child.implementationOf;

const isMethod = (child: PropData) => child.kind === TypeDocKind.Method && !child.overwrites;

const renderClass = (clx: ClassDefinitionData, hasMultipleClasses: boolean): JSX.Element => {
  const { name, comment, type, extendedTypes, children, implementedTypes } = clx;
  const properties = children?.filter(isProp);
  const methods = children?.filter(isMethod);

  return (
    <div key={`class-definition-${name}`} css={STYLES_APIBOX}>
      {hasMultipleClasses ? (
        <H3Code>
          <InlineCode>{name}</InlineCode>
        </H3Code>
      ) : (
        <H2>{name}</H2>
      )}
      {(extendedTypes?.length || implementedTypes?.length) && (
        <P>
          <B>Type: </B>
          {type ? <InlineCode>{resolveTypeName(type)}</InlineCode> : 'Class'}
          {extendedTypes?.length && (
            <>
              <span> extends </span>
              {extendedTypes.map(extendedType => (
                <InlineCode key={`extends-${extendedType.name}`}>
                  {resolveTypeName(extendedType)}
                </InlineCode>
              ))}
            </>
          )}
          {implementedTypes?.length && (
            <>
              <span> implements </span>
              {implementedTypes.map(implementedType => (
                <InlineCode key={`implements-${implementedType.name}`}>
                  {resolveTypeName(implementedType)}
                </InlineCode>
              ))}
            </>
          )}
        </P>
      )}
      <CommentTextBlock comment={comment} />
      {properties?.length ? (
        <>
          {hasMultipleClasses ? (
            <div css={STYLES_NESTED_SECTION_HEADER}>
              <H4>{name} Properties</H4>
            </div>
          ) : (
            <H2>{name} Properties</H2>
          )}
          <div>
            {properties.map(property =>
              renderProp(property, property?.defaultValue, !hasMultipleClasses)
            )}
          </div>
        </>
      ) : null}
      {methods?.length && (
        <>
          {hasMultipleClasses ? (
            <div css={STYLES_NESTED_SECTION_HEADER}>
              <H4>{name} Methods</H4>
            </div>
          ) : (
            <H2>{name} Methods</H2>
          )}
          {methods.map((method, index) =>
            renderMethod(method, index, methods.length, undefined, undefined, !hasMultipleClasses)
          )}
        </>
      )}
    </div>
  );
};

const APISectionClasses = ({ data }: APISectionClassesProps) => {
  if (data?.length) {
    const hasMultipleClasses = data.length > 1;
    return (
      <>
        {hasMultipleClasses ? <H2>Classes</H2> : null}
        {data.map(cls => renderClass(cls, hasMultipleClasses))}
      </>
    );
  }
  return null;
};

export default APISectionClasses;
