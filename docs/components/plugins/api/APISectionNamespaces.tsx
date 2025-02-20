import ReactMarkdown from 'react-markdown';

import { H2 } from '~/ui/components/Text';

import { ClassDefinitionData, GeneratedData, PropData, TypeDocKind } from './APIDataTypes';
import { APISectionDeprecationNote } from './APISectionDeprecationNote';
import { renderMethod } from './APISectionMethods';
import { getTagData, mdComponents, getCommentContent, getAllTagData } from './APISectionUtils';
import { APIBoxHeader } from './components/APIBoxHeader';
import { APIBoxSectionHeader } from './components/APIBoxSectionHeader';
import { APICommentTextBlock } from './components/APICommentTextBlock';
import { STYLES_APIBOX } from './styles';

export type APISectionNamespacesProps = {
  data: GeneratedData[];
  sdkVersion: string;
};

const isMethod = (child: PropData, allowOverwrites: boolean = false) =>
  child.kind &&
  [TypeDocKind.Method, TypeDocKind.Function].includes(child.kind) &&
  (allowOverwrites || !child.overwrites) &&
  !child.name.startsWith('_') &&
  !child?.implementationOf;

function getValidMethods(children: PropData[]) {
  return children
    ?.filter(child => isMethod(child))
    .sort((a: PropData, b: PropData) => a.name.localeCompare(b.name));
}

const renderNamespace = (namespace: ClassDefinitionData, sdkVersion: string): JSX.Element => {
  const { name, comment, children } = namespace;

  const methods = getValidMethods(children);
  const returnComment = getTagData('returns', comment);
  const namespacePlatforms = getAllTagData('platform', comment);

  return (
    <div key={`class-definition-${name}`} className={STYLES_APIBOX}>
      <APISectionDeprecationNote comment={comment} sticky />
      <APIBoxHeader name={name} comment={comment} />
      <APICommentTextBlock comment={comment} includePlatforms={false} />
      {returnComment && (
        <>
          <APIBoxSectionHeader text="Returns" />
          <ReactMarkdown components={mdComponents}>
            {getCommentContent(returnComment.content)}
          </ReactMarkdown>
        </>
      )}
      {methods?.length > 0 && (
        <>
          <APIBoxSectionHeader text={`${name} Methods`} exposeInSidebar={false} />
          {methods.map(method =>
            renderMethod(method, {
              sdkVersion,
              nested: true,
              parentPlatforms: namespacePlatforms,
              baseNestingLevel: 4,
            })
          )}
        </>
      )}
    </div>
  );
};

const APISectionNamespaces = ({ data, sdkVersion }: APISectionNamespacesProps) => {
  if (data?.length) {
    return (
      <>
        <H2>Namespaces</H2>
        {data.map(namespace => renderNamespace(namespace, sdkVersion))}
      </>
    );
  }
  return null;
};

export default APISectionNamespaces;
