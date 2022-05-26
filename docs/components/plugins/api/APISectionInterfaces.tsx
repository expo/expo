import React from 'react';

import { InlineCode } from '~/components/base/code';
import { B, P } from '~/components/base/paragraph';
import { H2, H3Code } from '~/components/plugins/Headings';
import {
  CommentData,
  CommentTagData,
  InterfaceDefinitionData,
  MethodSignatureData,
  PropData,
} from '~/components/plugins/api/APIDataTypes';
import {
  CommentTextBlock,
  getTagData,
  mdInlineComponents,
  renderFlags,
  renderParam,
  renderTypeOrSignatureType,
  resolveTypeName,
} from '~/components/plugins/api/APISectionUtils';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';

export type APISectionInterfacesProps = {
  data: InterfaceDefinitionData[];
};

const renderDefaultValue = (defaultValue?: CommentTagData) =>
  defaultValue ? (
    <>
      <br />
      <br />
      <B>Default:</B> <InlineCode>{defaultValue.text}</InlineCode>
    </>
  ) : null;

const renderInterfaceComment = (comment?: CommentData, signatures?: MethodSignatureData[]) => {
  if (signatures && signatures.length) {
    const { type, parameters, comment: signatureComment } = signatures[0];
    const defaultValue = getTagData('default', signatureComment);
    return (
      <>
        {parameters?.length ? parameters.map(param => renderParam(param)) : null}
        <B>Returns: </B>
        <InlineCode>{resolveTypeName(type)}</InlineCode>
        {signatureComment && (
          <>
            <br />
            <CommentTextBlock
              comment={signatureComment}
              components={mdInlineComponents}
              afterContent={renderDefaultValue(defaultValue)}
            />
          </>
        )}
      </>
    );
  } else {
    const defaultValue = getTagData('default', comment);
    return comment ? (
      <CommentTextBlock
        comment={comment}
        components={mdInlineComponents}
        afterContent={renderDefaultValue(defaultValue)}
      />
    ) : (
      '-'
    );
  }
};

const renderInterfacePropertyRow = ({
  name,
  flags,
  type,
  comment,
  signatures,
}: PropData): JSX.Element => (
  <Row key={name}>
    <Cell>
      <B>
        {name}
        {signatures && signatures.length ? '()' : ''}
      </B>
      {renderFlags(flags)}
    </Cell>
    <Cell>{renderTypeOrSignatureType(type, signatures)}</Cell>
    <Cell>{renderInterfaceComment(comment, signatures)}</Cell>
  </Row>
);

const renderInterface = ({
  name,
  children,
  comment,
  extendedTypes,
}: InterfaceDefinitionData): JSX.Element | null =>
  children ? (
    <div key={`interface-definition-${name}`}>
      <H3Code>
        <InlineCode>{name}</InlineCode>
      </H3Code>
      {extendedTypes?.length && (
        <P>
          <B>Extends: </B>
          {extendedTypes.map(extendedType => (
            <InlineCode key={`extend-${extendedType.name}`}>
              {resolveTypeName(extendedType)}
            </InlineCode>
          ))}
        </P>
      )}
      <CommentTextBlock comment={comment} />
      <Table>
        <TableHead>
          <Row>
            <HeaderCell>Name</HeaderCell>
            <HeaderCell>Type</HeaderCell>
            <HeaderCell>Description</HeaderCell>
          </Row>
        </TableHead>
        <tbody>
          {children.filter(child => !child?.inheritedFrom).map(renderInterfacePropertyRow)}
        </tbody>
      </Table>
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
