import { css } from '@emotion/react';
import { mergeClasses, theme, Themes, typography } from '@expo/styleguide';
import { borderRadius, spacing } from '@expo/styleguide-base';
import { FileCode01Icon } from '@expo/styleguide-icons/outline/FileCode01Icon';
import { LayoutAlt01Icon } from '@expo/styleguide-icons/outline/LayoutAlt01Icon';
import { Server03Icon } from '@expo/styleguide-icons/outline/Server03Icon';
import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import tippy, { roundArrow } from 'tippy.js';

import {
  cleanCopyValue,
  getRootCodeBlockProps,
  getCodeData,
  parseValue,
  getCollapseHeight,
} from '~/common/code-utilities';
import { useCodeBlockSettingsContext } from '~/providers/CodeBlockSettingsProvider';
import { Snippet } from '~/ui/components/Snippet/Snippet';
import { SnippetContent } from '~/ui/components/Snippet/SnippetContent';
import { SnippetExpandOverlay } from '~/ui/components/Snippet/SnippetExpandOverlay';
import { SnippetHeader } from '~/ui/components/Snippet/SnippetHeader';
import { CopyAction } from '~/ui/components/Snippet/actions/CopyAction';
import { SettingsAction } from '~/ui/components/Snippet/actions/SettingsAction';
import { CODE } from '~/ui/components/Text';
import { TextTheme } from '~/ui/components/Text/types';

// @ts-ignore Jest ESM issue https://github.com/facebook/jest/issues/9430
const { default: testTippy } = tippy;

const attributes = {
  'data-text': true,
};

type CodeProps = PropsWithChildren<{
  className?: string;
}>;

export function Code({ className, children }: CodeProps) {
  const contentRef = useRef<HTMLPreElement>(null);
  const { preferredTheme, wordWrap } = useCodeBlockSettingsContext();

  const rootProps = getRootCodeBlockProps(children, className);
  const codeBlockData = parseValue(rootProps?.children?.toString() ?? '');

  const [isExpanded, setExpanded] = useState(false);
  const [collapseBound, setCollapseBound] = useState<number | undefined>(undefined);
  const [blockHeight, setBlockHeight] = useState<number | undefined>(undefined);

  const collapseHeight = getCollapseHeight(codeBlockData.params);
  const showExpand = !isExpanded && blockHeight && collapseBound && blockHeight > collapseBound;
  const highlightedHtml = getCodeData(codeBlockData.value, rootProps.className);

  useEffect(() => {
    const tippyFunc = testTippy || tippy;
    tippyFunc('.code-annotation.with-tooltip', {
      allowHTML: true,
      theme: 'expo',
      placement: 'top',
      arrow: roundArrow,
      interactive: true,
      offset: [0, 20],
      appendTo: document.body,
    });

    tippyFunc('.tutorial-code-annotation.with-tooltip', {
      allowHTML: true,
      theme: 'expo',
      placement: 'top',
      arrow: roundArrow,
      interactive: true,
      offset: [0, 20],
      appendTo: document.body,
    });

    if (contentRef?.current?.clientHeight) {
      setBlockHeight(contentRef.current.clientHeight);
      if (contentRef.current.clientHeight > collapseHeight) {
        setCollapseBound(collapseHeight);
      }
    }
  }, []);

  function expandCodeBlock() {
    setExpanded(true);
    setCollapseBound(undefined);
  }

  const commonClasses = [
    wordWrap && '!whitespace-pre-wrap !break-words',
    showExpand && !isExpanded && `!overflow-hidden`,
  ];

  return codeBlockData?.title ? (
    <Snippet>
      <SnippetHeader title={codeBlockData.title} Icon={getIconForFile(codeBlockData.title)}>
        <CopyAction text={cleanCopyValue(codeBlockData.value)} />
        <SettingsAction />
      </SnippetHeader>
      <SnippetContent className="p-0">
        <pre
          ref={contentRef}
          css={STYLES_CODE_CONTAINER}
          style={{
            maxHeight: collapseBound,
          }}
          className={mergeClasses('relative', ...commonClasses)}
          {...attributes}>
          <code
            css={STYLES_CODE_BLOCK}
            dangerouslySetInnerHTML={{ __html: highlightedHtml.replace(/^@@@.+@@@/g, '') }}
          />
          {showExpand && <SnippetExpandOverlay onClick={expandCodeBlock} />}
        </pre>
      </SnippetContent>
    </Snippet>
  ) : (
    <pre
      ref={contentRef}
      css={STYLES_CODE_CONTAINER}
      style={{
        maxHeight: collapseBound,
      }}
      className={mergeClasses(
        'relative border border-secondary p-4 my-4 bg-subtle',
        preferredTheme === Themes.DARK && 'dark-theme',
        ...commonClasses,
        'last:mb-0'
      )}
      {...attributes}>
      <code css={STYLES_CODE_BLOCK} dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      {showExpand && <SnippetExpandOverlay onClick={expandCodeBlock} />}
    </pre>
  );
}

const STYLES_CODE_BLOCK = css`
  ${typography.body.code};
  color: ${theme.text.default};
  white-space: inherit;
  padding: 0;
  margin: 0;
`;

const STYLES_CODE_CONTAINER = css`
  white-space: pre;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  line-height: 120%;
  border-radius: ${borderRadius.sm}px;
  padding: ${spacing[4]}px;

  table &:last-child {
    margin-bottom: 0;
  }
`;

type CodeBlockProps = PropsWithChildren<{
  inline?: boolean;
  theme?: TextTheme;
  className?: string;
}>;

export const CodeBlock = ({ children, theme, className, inline = false }: CodeBlockProps) => {
  const Element = inline ? 'span' : 'pre';
  return (
    <Element
      className={mergeClasses('m-0 px-1 py-1.5', inline && 'inline-flex !p-0')}
      css={STYLES_CODE_CONTAINER}
      {...attributes}>
      <CODE
        className={mergeClasses('!text-[85%]', inline && 'inline-flex w-full !p-1.5', className)}
        theme={theme}
        css={STYLES_CODE_BLOCK}>
        {children}
      </CODE>
    </Element>
  );
};

function getIconForFile(filename: string) {
  if (/_layout\.[jt]sx?$/.test(filename)) {
    return LayoutAlt01Icon;
  }
  if (/\+api\.[jt]sx?$/.test(filename)) {
    return Server03Icon;
  }
  return FileCode01Icon;
}
