import { css } from '@emotion/react';
import React from 'react';

import { InlineCode } from '~/components/base/code';
import { UL, LI } from '~/components/base/list';
import { B, P } from '~/components/base/paragraph';
import { H2, H4, H3Code } from '~/components/plugins/Headings';
import {
  ClassDefinitionData,
  CommentData,
  GeneratedData,
  MethodSignatureData,
  PropData,
} from '~/components/plugins/api/APIDataTypes';
import {
  CommentTextBlock,
  listParams,
  mdInlineComponents,
  renderParam,
  renderTypeOrSignatureType,
  resolveTypeName,
  STYLES_OPTIONAL,
  TypeDocKind,
} from '~/components/plugins/api/APISectionUtils';

export type APISectionClassesProps = {
  data: GeneratedData[];
};

const renderPropertyComment = (comment?: CommentData, signatures?: MethodSignatureData[]) => {
  if (signatures && signatures.length) {
    const { type, parameters, comment: signatureComment } = signatures[0];
    return (
      <>
        <UL>
          {parameters?.map(param => renderParam(param))}
          <LI returnType>
            <InlineCode>{resolveTypeName(type)}</InlineCode>
          </LI>
        </UL>
        {signatureComment && (
          <CommentTextBlock comment={signatureComment} components={mdInlineComponents} />
        )}
      </>
    );
  } else {
    return comment ? <CommentTextBlock comment={comment} components={mdInlineComponents} /> : null;
  }
};

const renderProperty = ({ name, signatures, flags, type, comment }: PropData) => (
  <LI customCss={css({ marginBottom: 6 })}>
    <B>
      {name}
      {signatures && signatures.length ? `(${listParams(signatures[0].parameters)})` : null}
    </B>
    {!signatures ? <>&emsp;{renderTypeOrSignatureType(type, signatures)}</> : null}
    {flags?.isOptional ? <span css={STYLES_OPTIONAL}>&emsp;&bull;&emsp;optional</span> : null}
    {!signatures ? <br /> : null}
    {renderPropertyComment(comment, signatures)}
  </LI>
);

const renderClass = ({
  name,
  comment,
  type,
  extendedTypes,
  children,
}: ClassDefinitionData): JSX.Element => {
  const properties = children?.filter(child => child.kind === TypeDocKind.Property);
  const methods = children?.filter(child => child.kind === TypeDocKind.Method);
  return (
    <div key={`class-definition-${name}`}>
      <H3Code>
        <InlineCode>{name}</InlineCode>
      </H3Code>
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
          <H4>Properties:</H4>
          <UL>{properties.map(child => renderProperty(child))}</UL>
        </>
      ) : null}
      {methods?.length ? (
        <>
          <H4>Methods:</H4>
          <UL>{methods.map(child => renderProperty(child))}</UL>
        </>
      ) : null}
    </div>
  );
};

const APISectionClasses = ({ data }: APISectionClassesProps) =>
  data?.length ? (
    <>
      <H2 key="classes-header">Classes</H2>
      {data.map(cls => renderClass(cls))}
    </>
  ) : null;

export default APISectionClasses;
