import React from 'react';

import { InlineCode } from '~/components/base/code';
import { B } from '~/components/base/paragraph';
import { H2, H3Code } from '~/components/plugins/Headings';
import {
  CommentData,
  InterfaceDefinitionData,
  MethodSignatureData,
  PropData,
} from '~/components/plugins/api/APIDataTypes';
import {
  CommentTextBlock,
  mdInlineComponents,
  renderFlags,
  renderParam,
  renderTypeOrSignatureType,
  resolveTypeName,
} from '~/components/plugins/api/APISectionUtils';

export type APISectionInterfacesProps = {
  data: InterfaceDefinitionData[];
};

const renderInterfaceComment = (comment?: CommentData, signatures?: MethodSignatureData[]) => {
  if (signatures && signatures.length) {
    const { type, parameters, comment: signatureComment } = signatures[0];
    return (
      <>
        {parameters.map(param => renderParam(param))}
        <B>Returns: </B>
        <InlineCode>{resolveTypeName(type)}</InlineCode>
        {signatureComment && (
          <CommentTextBlock comment={signatureComment} components={mdInlineComponents} />
        )}
      </>
    );
  } else {
    return comment ? <CommentTextBlock comment={comment} components={mdInlineComponents} /> : '-';
  }
};

const renderInterfacePropertyRow = ({
  name,
  flags,
  type,
  comment,
  signatures,
}: PropData): JSX.Element => (
  <tr key={name}>
    <td>
      <B>
        {name}
        {signatures && signatures.length ? '()' : ''}
      </B>
      {renderFlags(flags)}
    </td>
    <td>{renderTypeOrSignatureType(type, signatures)}</td>
    <td>{renderInterfaceComment(comment, signatures)}</td>
  </tr>
);

const renderInterface = ({
  name,
  children,
  comment,
}: InterfaceDefinitionData): JSX.Element | null =>
  children ? (
    <div key={`interface-definition-${name}`}>
      <H3Code>
        <InlineCode>{name}</InlineCode>
      </H3Code>
      <CommentTextBlock comment={comment} />
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>{children.map(renderInterfacePropertyRow)}</tbody>
      </table>
    </div>
  ) : null;

const APISectionInterfaces = ({ data }: APISectionInterfacesProps) =>
  data?.length ? (
    <>
      <H2 key="interfaces-header">Interfaces</H2>
      {data.map(renderInterface)}
    </>
  ) : null;

export default APISectionInterfaces;
