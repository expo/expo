import React from 'react';
import ReactMarkdown from 'react-markdown';

import { InlineCode } from '~/components/base/code';
import { B, P } from '~/components/base/paragraph';
import { H2, H2Nested, H3Code, H4 } from '~/components/plugins/Headings';
import {
  ClassDefinitionData,
  GeneratedData,
  PropData,
} from '~/components/plugins/api/APIDataTypes';
import { APISectionDeprecationNote } from '~/components/plugins/api/APISectionDeprecationNote';
import { renderMethod } from '~/components/plugins/api/APISectionMethods';
import { renderProp } from '~/components/plugins/api/APISectionProps';
import {
  CommentTextBlock,
  getTagData,
  getTagNamesList,
  mdComponents,
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

const isMethod = (child: PropData) =>
  child.kind === TypeDocKind.Method &&
  !child.overwrites &&
  !child.name.startsWith('_') &&
  !child?.implementationOf;

const renderClass = (clx: ClassDefinitionData, exposeInSidebar: boolean): JSX.Element => {
  const { name, comment, type, extendedTypes, children, implementedTypes } = clx;
  const properties = children?.filter(isProp);
  const methods = children
    ?.filter(isMethod)
    .sort((a: PropData, b: PropData) => a.name.localeCompare(b.name));
  const returnComment = getTagData('returns', comment);
  const Header = exposeInSidebar ? H2Nested : H4;

  return (
    <div key={`class-definition-${name}`} css={STYLES_APIBOX}>
      <APISectionDeprecationNote comment={comment} />
      <H3Code tags={getTagNamesList(comment)}>
        <InlineCode>{name}</InlineCode>
      </H3Code>
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
      {returnComment && (
        <>
          <div css={STYLES_NESTED_SECTION_HEADER}>
            <H4>Returns</H4>
          </div>
          <ReactMarkdown components={mdComponents}>{returnComment.text}</ReactMarkdown>
        </>
      )}
      {properties?.length ? (
        <>
          <div css={STYLES_NESTED_SECTION_HEADER}>
            <Header>{name} Properties</Header>
          </div>
          <div>
            {properties.map(property =>
              renderProp(property, property?.defaultValue, exposeInSidebar)
            )}
          </div>
        </>
      ) : null}
      {methods?.length && (
        <>
          <div css={STYLES_NESTED_SECTION_HEADER}>
            <Header>{name} Methods</Header>
          </div>
          {methods.map(method => renderMethod(method, { exposeInSidebar }))}
        </>
      )}
    </div>
  );
};

const APISectionClasses = ({ data }: APISectionClassesProps) => {
  if (data?.length) {
    const exposeInSidebar = data.length < 2;
    return (
      <>
        <H2>Classes</H2>
        {data.map(cls => renderClass(cls, exposeInSidebar))}
      </>
    );
  }
  return null;
};

export default APISectionClasses;
