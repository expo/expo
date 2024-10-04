import { css } from '@emotion/react';
import { breakpoints, spacing } from '@expo/styleguide-base';
import { FileCode01Icon } from '@expo/styleguide-icons';
import { PropsWithChildren } from 'react';

import { cleanCopyValue } from '~/components/base/code';
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
    <div css={[codeBlocksWrapperStyle, connected && codeBlockConnectedWrapperStyle]} {...rest}>
      {codeBlocks.map((codeBlock, index) => (
        <Snippet key={index} className="last:mb-4 max-xl:!mb-0">
          <SnippetHeader title={tabNames[index]} Icon={FileCode01Icon}>
            <CopyAction text={cleanCopyValue(codeBlock.props.children.props.children)} />
          </SnippetHeader>
          <SnippetContent className="p-0 h-full">{codeBlock}</SnippetContent>
        </Snippet>
      ))}
    </div>
  );
}

const codeBlocksWrapperStyle = css({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: spacing[4],
  gridAutoRows: '1fr',

  pre: {
    border: 0,
    margin: 0,
    gridTemplateRows: 'minmax(100px, 1fr)',
    height: '100%',
  },

  [`@media screen and (max-width: ${breakpoints.large}px)`]: {
    gridTemplateColumns: 'minmax(0, 1fr)',
    gridAutoRows: 'auto',
  },
});

const codeBlockConnectedWrapperStyle = css({
  [`@media screen and (min-width: ${breakpoints.large}px)`]: {
    gridGap: 0,

    '> div:nth-of-type(odd)': {
      '> div': {
        borderRight: 0,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
      },
    },

    '> div:nth-of-type(even)': {
      '> div': {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
      },
    },
  },
});
