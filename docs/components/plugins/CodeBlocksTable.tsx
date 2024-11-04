import { mergeClasses } from '@expo/styleguide';
import { FileCode01Icon } from '@expo/styleguide-icons/outline/FileCode01Icon';
import { PropsWithChildren } from 'react';

import { cleanCopyValue } from '~/common/code-utilities';
import { Snippet } from '~/ui/components/Snippet/Snippet';
import { SnippetContent } from '~/ui/components/Snippet/SnippetContent';
import { SnippetHeader } from '~/ui/components/Snippet/SnippetHeader';
import { CopyAction } from '~/ui/components/Snippet/actions/CopyAction';

const MDX_CLASS_NAME_TO_TAB_NAME: Record<string, string> = {
  'language-swift': 'Swift',
  'language-kotlin': 'Kotlin',
  'language-javascript': 'JavaScript',
  'language-typescript': 'TypeScript',
  'language-json': 'JSON',
  'language-ruby': 'Ruby',
  'language-groovy': 'Gradle',
};

type Props = PropsWithChildren<{
  tabs?: string[];
  connected?: boolean;
}>;

export function CodeBlocksTable({ children, tabs, connected = true, ...rest }: Props) {
  const childrenArray = Array.isArray(children) ? children : [children];
  const codeBlocks = childrenArray.filter(
    ({ props }) =>
      props.children.props.className && props.children.props.className.startsWith('language-')
  );
  const tabNames =
    tabs ||
    codeBlocks.map(child => {
      const className = child.props.children.props.className;
      return MDX_CLASS_NAME_TO_TAB_NAME[className] || className.replace('language-', '');
    });

  return (
    <div
      className={mergeClasses(
        'grid grid-cols-2 gap-4',
        connected && 'lg-gutters:mb-4 lg-gutters:gap-0',
        connected &&
          '[&>div:nth-child(odd)>div]:lg-gutters:!rounded-r-none [&>div:nth-child(odd)>div]:lg-gutters:border-r-0',
        connected && '[&>div:nth-child(even)>div]:lg-gutters:!rounded-l-none',
        '[&_pre]:m-0 [&_pre]:border-0',
        'max-lg-gutters:grid-cols-1'
      )}
      {...rest}>
      {codeBlocks.map((codeBlock, index) => (
        <Snippet key={index} className="mb-0 last:max-lg-gutters:mb-4">
          <SnippetHeader title={tabNames[index]} Icon={FileCode01Icon}>
            <CopyAction text={cleanCopyValue(codeBlock.props.children.props.children)} />
          </SnippetHeader>
          <SnippetContent className="h-full p-0">{codeBlock}</SnippetContent>
        </Snippet>
      ))}
    </div>
  );
}
