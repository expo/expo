import React from 'react';
import ReactMarkdown from 'react-markdown';

import { InlineCode } from '~/components/base/code';
import { B } from '~/components/base/paragraph';
import { H2, H3Code } from '~/components/plugins/Headings';
import { InterfaceDefinitionData, InterfaceValueData } from '~/components/plugins/api/APIDataTypes';
import {
  CommentTextBlock,
  mdInlineRenderers,
  resolveTypeName,
  STYLES_OPTIONAL,
} from '~/components/plugins/api/APISectionUtils';

export type APISectionInterfacesProps = {
  data: InterfaceDefinitionData[];
};

const renderInterfacePropertyRow = ({
  name,
  flags,
  type,
  comment,
}: InterfaceValueData): JSX.Element => (
  <tr key={name}>
    <td>
      <B>{name}</B>
      {flags?.isOptional ? (
        <>
          <br />
          <span css={STYLES_OPTIONAL}>(optional)</span>
        </>
      ) : null}
    </td>
    <td>
      <InlineCode>{resolveTypeName(type)}</InlineCode>
    </td>
    <td>
      {comment?.shortText ? (
        <ReactMarkdown renderers={mdInlineRenderers}>{comment.shortText}</ReactMarkdown>
      ) : (
        '-'
      )}
    </td>
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

const APISectionInterfaces: React.FC<APISectionInterfacesProps> = ({ data }) =>
  data?.length ? (
    <>
      <H2 key="interfaces-header">Interfaces</H2>
      {data.map(renderInterface)}
    </>
  ) : null;

export default APISectionInterfaces;
