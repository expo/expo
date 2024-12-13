import ReactMarkdown from 'react-markdown';

import { APIBoxSectionHeader } from '~/components/plugins/api/components/APIBoxSectionHeader';
import { H2, MONOSPACE } from '~/ui/components/Text';

import { ClassDefinitionData, GeneratedData, PropData, TypeDocKind } from './APIDataTypes';
import { APISectionDeprecationNote } from './APISectionDeprecationNote';
import { renderMethod } from './APISectionMethods';
import {
  getTagData,
  getTagNamesList,
  mdComponents,
  H3Code,
  getCommentContent,
} from './APISectionUtils';
import { APICommentTextBlock } from './components/APICommentTextBlock';
import { APISectionPlatformTags } from './components/APISectionPlatformTags';
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

  return (
    <div key={`class-definition-${name}`} className={STYLES_APIBOX}>
      <APISectionDeprecationNote comment={comment} sticky />
      <div className="flex flex-wrap justify-between max-md-gutters:flex-col">
        <H3Code tags={getTagNamesList(comment)}>
          <MONOSPACE weight="medium" className="wrap-anywhere">
            {name}
          </MONOSPACE>
        </H3Code>
        <APISectionPlatformTags comment={comment} />
      </div>
      <APICommentTextBlock comment={comment} includePlatforms={false} />
      {returnComment && (
        <>
          <APIBoxSectionHeader text="Returns" />
          <ReactMarkdown components={mdComponents}>
            {getCommentContent(returnComment.content)}
          </ReactMarkdown>
        </>
      )}
      {methods?.length ? (
        <>
          <APIBoxSectionHeader text={`${name} Methods`} exposeInSidebar={false} />
          {methods.map(method => renderMethod(method, { sdkVersion, baseNestingLevel: 4 }))}
        </>
      ) : undefined}
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
