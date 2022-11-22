import ReactMarkdown from 'react-markdown';

import { InlineCode } from '~/components/base/code';
import { H2, H2Nested, H3Code, H4 } from '~/components/plugins/Headings';
import {
  ClassDefinitionData,
  GeneratedData,
  PropData,
} from '~/components/plugins/api/APIDataTypes';
import { APISectionDeprecationNote } from '~/components/plugins/api/APISectionDeprecationNote';
import { renderMethod } from '~/components/plugins/api/APISectionMethods';
import {
  CommentTextBlock,
  getTagData,
  getTagNamesList,
  mdComponents,
  STYLES_APIBOX,
  STYLES_NESTED_SECTION_HEADER,
  TypeDocKind,
} from '~/components/plugins/api/APISectionUtils';

export type APISectionNamespacesProps = {
  data: GeneratedData[];
};

const isMethod = (child: PropData, allowOverwrites: boolean = false) =>
  child.kind &&
  [TypeDocKind.Method, TypeDocKind.Function].includes(child.kind) &&
  (allowOverwrites || !child.overwrites) &&
  !child.name.startsWith('_') &&
  !child?.implementationOf;

const renderNamespace = (namespace: ClassDefinitionData, exposeInSidebar: boolean): JSX.Element => {
  const { name, comment, children } = namespace;
  const Header = exposeInSidebar ? H2Nested : H4;

  const methods = children
    ?.filter(child => isMethod(child))
    .sort((a: PropData, b: PropData) => a.name.localeCompare(b.name));
  const returnComment = getTagData('returns', comment);

  return (
    <div key={`class-definition-${name}`} css={STYLES_APIBOX}>
      <APISectionDeprecationNote comment={comment} />
      <H3Code tags={getTagNamesList(comment)}>
        <InlineCode>{name}</InlineCode>
      </H3Code>
      <CommentTextBlock comment={comment} />
      {returnComment && (
        <>
          <div css={STYLES_NESTED_SECTION_HEADER}>
            <H4>Returns</H4>
          </div>
          <ReactMarkdown components={mdComponents}>{returnComment.text}</ReactMarkdown>
        </>
      )}
      {methods?.length ? (
        <>
          <div css={STYLES_NESTED_SECTION_HEADER}>
            <Header>{name} Methods</Header>
          </div>
          {methods.map(method => renderMethod(method, { exposeInSidebar }))}
        </>
      ) : undefined}
    </div>
  );
};

const APISectionNamespaces = ({ data }: APISectionNamespacesProps) => {
  if (data?.length) {
    const exposeInSidebar = data.length < 2;
    return (
      <>
        <H2>Namespaces</H2>
        {data.map(namespace => renderNamespace(namespace, exposeInSidebar))}
      </>
    );
  }
  return null;
};

export default APISectionNamespaces;
