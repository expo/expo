import { css } from '@emotion/react';
import { mergeClasses, theme, Themes, typography } from '@expo/styleguide';
import { borderRadius, spacing } from '@expo/styleguide-base';
import { FileCode01Icon } from '@expo/styleguide-icons/outline/FileCode01Icon';
import { LayoutAlt01Icon } from '@expo/styleguide-icons/outline/LayoutAlt01Icon';
import { Server03Icon } from '@expo/styleguide-icons/outline/Server03Icon';
import { Language, Prism } from 'prism-react-renderer';
import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import tippy, { roundArrow } from 'tippy.js';

import {
  cleanCopyValue,
  getRootCodeBlockProps,
  LANGUAGES_REMAP,
  parseValue,
  replaceHashCommentsWithAnnotations,
  replaceSlashCommentsWithAnnotations,
  replaceXmlCommentsWithAnnotations,
} from '~/common/code-utilities';
import { useCodeBlockSettingsContext } from '~/providers/CodeBlockSettingsProvider';
import { Snippet } from '~/ui/components/Snippet/Snippet';
import { SnippetContent } from '~/ui/components/Snippet/SnippetContent';
import {
  EXPAND_SNIPPET_BOUND,
  EXPAND_SNIPPET_BOUND_CLASSNAME,
  SnippetExpandOverlay,
} from '~/ui/components/Snippet/SnippetExpandOverlay';
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
  const [isExpanded, setExpanded] = useState(true);

  const rootProps = getRootCodeBlockProps(children, className);

  const codeBlockData = parseValue(rootProps?.children?.toString() || '');
  const collapseHeight = codeBlockData?.params?.collapseHeight
    ? Number(codeBlockData?.params?.collapseHeight)
    : EXPAND_SNIPPET_BOUND;

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

    if (contentRef?.current?.clientHeight) {
      if (contentRef.current.clientHeight > collapseHeight) {
        setExpanded(false);
      }
    }
  }, []);

  let html = codeBlockData.value;

  // mdx will add the class `language-foo` to codeblocks with the tag `foo`
  // if this class is present, we want to slice out `language-`
  let lang = rootProps.className && rootProps.className.split('-').at(-1).toLowerCase();

  // Allow for code blocks without a language.
  if (lang) {
    if (lang in LANGUAGES_REMAP) {
      lang = LANGUAGES_REMAP[lang];
    }

    const grammar = Prism.languages[lang as keyof typeof Prism.languages];
    if (!grammar) {
      throw new Error(`docs currently do not support language: ${lang}`);
    }

    html = Prism.highlight(html, grammar, lang as Language);
    if (['properties', 'ruby', 'bash', 'yaml'].includes(lang)) {
      html = replaceHashCommentsWithAnnotations(html);
    } else if (['xml', 'html'].includes(lang)) {
      html = replaceXmlCommentsWithAnnotations(html);
    } else {
      html = replaceSlashCommentsWithAnnotations(html);
    }
  }

  const commonClasses = [
    wordWrap && '!whitespace-pre-wrap !break-words',
    isExpanded && 'max-h-[unset]',
    !isExpanded && `!overflow-hidden`,
    !isExpanded && collapseHeight && `max-h-[${collapseHeight}px]`,
    !isExpanded && !collapseHeight && EXPAND_SNIPPET_BOUND_CLASSNAME,
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
          className={mergeClasses('relative', ...commonClasses)}
          {...attributes}>
          <code
            css={STYLES_CODE_BLOCK}
            dangerouslySetInnerHTML={{ __html: html.replace(/^@@@.+@@@/g, '') }}
          />
          {!isExpanded && <SnippetExpandOverlay onClick={() => setExpanded(true)} />}
        </pre>
      </SnippetContent>
    </Snippet>
  ) : (
    <pre
      ref={contentRef}
      css={[STYLES_CODE_CONTAINER, STYLES_CODE_CONTAINER_BLOCK]}
      className={mergeClasses(
        'relative',
        preferredTheme === Themes.DARK && 'dark-theme',
        ...commonClasses,
        'last:mb-0'
      )}
      {...attributes}>
      <code css={STYLES_CODE_BLOCK} dangerouslySetInnerHTML={{ __html: html }} />
      {!isExpanded && <SnippetExpandOverlay onClick={() => setExpanded(true)} />}
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

const STYLES_CODE_CONTAINER_BLOCK = css`
  border: 1px solid ${theme.border.secondary};
  padding: 16px;
  margin: 16px 0;
  background-color: ${theme.background.subtle};
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

const codeBlockContainerStyle = {
  margin: 0,
  padding: `3px 6px`,
};

const codeBlockInlineStyle = {
  padding: 4,
};

const codeBlockInlineContainerStyle = {
  display: 'inline-flex',
  padding: 0,
};

type CodeBlockProps = PropsWithChildren<{ inline?: boolean; theme?: TextTheme }>;

export const CodeBlock = ({ children, theme, inline = false }: CodeBlockProps) => {
  const Element = inline ? 'span' : 'pre';
  return (
    <Element
      css={[
        STYLES_CODE_CONTAINER,
        codeBlockContainerStyle,
        inline && codeBlockInlineContainerStyle,
      ]}
      className="[&_span]:!text-inherit"
      {...attributes}>
      <CODE
        theme={theme}
        css={[
          STYLES_CODE_BLOCK,
          inline && codeBlockInlineStyle,
          { fontSize: '80%' },
          theme && { color: 'inherit' },
        ]}>
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
