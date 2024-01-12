import { css } from '@emotion/react';
import { mergeClasses, theme, Themes, typography } from '@expo/styleguide';
import { borderRadius, spacing } from '@expo/styleguide-base';
import { FileCode01Icon, LayoutAlt01Icon, Server03Icon } from '@expo/styleguide-icons';
import { Language, Prism } from 'prism-react-renderer';
import * as React from 'react';
import tippy, { roundArrow } from 'tippy.js';

import { useCodeBlockSettingsContext } from '~/providers/CodeBlockSettingsProvider';
import { Snippet } from '~/ui/components/Snippet/Snippet';
import { SnippetContent } from '~/ui/components/Snippet/SnippetContent';
import { SnippetHeader } from '~/ui/components/Snippet/SnippetHeader';
import { CopyAction } from '~/ui/components/Snippet/actions/CopyAction';
import { SettingsAction } from '~/ui/components/Snippet/actions/SettingsAction';
import { CODE } from '~/ui/components/Text';
import { TextTheme } from '~/ui/components/Text/types';

// @ts-ignore Jest ESM issue https://github.com/facebook/jest/issues/9430
const { default: testTippy } = tippy;

// Read more: https://github.com/FormidableLabs/prism-react-renderer#custom-language-support
async function initPrism() {
  (typeof global !== 'undefined' ? global : window).Prism = Prism;
  await import('prismjs/components/prism-bash' as Language);
  await import('prismjs/components/prism-diff' as Language);
  await import('prismjs/components/prism-groovy' as Language);
  await import('prismjs/components/prism-ini' as Language);
  await import('prismjs/components/prism-java' as Language);
  await import('prismjs/components/prism-json' as Language);
  await import('prismjs/components/prism-objectivec' as Language);
  await import('prismjs/components/prism-properties' as Language);
  await import('prismjs/components/prism-ruby' as Language);
}

await initPrism();

const attributes = {
  'data-text': true,
};

type Props = {
  className?: string;
};

export function cleanCopyValue(value: string) {
  return value
    .replace(/\/\*\s?@(info[^*]+|end|hide[^*]+).?\*\//g, '')
    .replace(/#\s?@(info[^#]+|end|hide[^#]+).?#/g, '')
    .replace(/<!--\s?@(info[^<>]+|end|hide[^<>]+).?-->/g, '')
    .replace(/^ +\r?\n|\n +\r?$/gm, '');
}

function escapeHtml(text: string) {
  return text.replace(/"/g, '&quot;');
}

function replaceXmlCommentsWithAnnotations(value: string) {
  return value
    .replace(
      /<span class="token (comment|plain-text)">&lt;!-- @info (.*?)--><\/span>\s*/g,
      (match, type, content) => {
        return content
          ? `<span class="code-annotation with-tooltip" data-tippy-content="${escapeHtml(
              content
            )}">`
          : '<span class="code-annotation">';
      }
    )
    .replace(
      /<span class="token (comment|plain-text)">&lt;!-- @hide (.*?)--><\/span>\s*/g,
      (match, type, content) => {
        return `<span><span class="code-hidden">%%placeholder-start%%</span><span class="code-placeholder">${escapeHtml(
          content
        )}</span><span class="code-hidden">%%placeholder-end%%</span><span class="code-hidden">`;
      }
    )
    .replace(/\s*<span class="token (comment|plain-text)">&lt;!-- @end --><\/span>/g, '</span>');
}

function replaceHashCommentsWithAnnotations(value: string) {
  return value
    .replace(
      /<span class="token (comment|plain-text)"># @info (.*?)#<\/span>\s*/g,
      (match, type, content) => {
        return content
          ? `<span class="code-annotation with-tooltip" data-tippy-content="${escapeHtml(
              content
            )}">`
          : '<span class="code-annotation">';
      }
    )
    .replace(
      /<span class="token (comment|plain-text)"># @hide (.*?)#<\/span>\s*/g,
      (match, type, content) => {
        return `<span><span class="code-hidden">%%placeholder-start%%</span><span class="code-placeholder">${escapeHtml(
          content
        )}</span><span class="code-hidden">%%placeholder-end%%</span><span class="code-hidden">`;
      }
    )
    .replace(/\s*<span class="token (comment|plain-text)"># @end #<\/span>/g, '</span>');
}

function replaceSlashCommentsWithAnnotations(value: string) {
  return value
    .replace(
      /<span class="token (comment|plain-text)">([\n\r\s]*)\/\* @info (.*?)\*\/[\n\r\s]*<\/span>\s*/g,
      (match, type, beforeWhitespace, content) => {
        return content
          ? `${beforeWhitespace}<span class="code-annotation with-tooltip" data-tippy-content="${escapeHtml(
              content
            )}">`
          : `${beforeWhitespace}<span class="code-annotation">`;
      }
    )
    .replace(
      /<span class="token (comment|plain-text)">([\n\r\s]*)\/\* @hide (.*?)\*\/([\n\r\s]*)<\/span>\s*/g,
      (match, type, beforeWhitespace, content, afterWhitespace) => {
        return `<span><span class="code-hidden">%%placeholder-start%%</span><span class="code-placeholder">${beforeWhitespace}${escapeHtml(
          content
        )}${afterWhitespace}</span><span class="code-hidden">%%placeholder-end%%</span><span class="code-hidden">`;
      }
    )
    .replace(
      /\s*<span class="token (comment|plain-text)">[\n\r\s]*\/\* @end \*\/([\n\r\s]*)<\/span>/g,
      (match, type, afterWhitespace) => `</span>${afterWhitespace}`
    );
}

function parseValue(value: string) {
  if (value.startsWith('@@@')) {
    const valueChunks = value.split('@@@');
    return {
      title: valueChunks[1],
      value: valueChunks[2],
    };
  }
  return {
    value,
  };
}

export function Code({ className, children }: React.PropsWithChildren<Props>) {
  const { preferredTheme, wordWrap } = useCodeBlockSettingsContext();

  React.useEffect(() => {
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
  }, []);

  // note(simek): MDX dropped `inlineCode` pseudo-tag, and we need to relay on `pre` and `code` now,
  // which results in this nesting mess, we should fix it in the future
  const rootProps =
    className && className.startsWith('language')
      ? { className, children }
      : (React.Children.toArray(children)[0] as JSX.Element)?.props;

  const value = parseValue(rootProps?.children?.toString() || '');
  let html = value.value;

  // mdx will add the class `language-foo` to codeblocks with the tag `foo`
  // if this class is present, we want to slice out `language-`
  let lang = rootProps.className && rootProps.className.slice(9).toLowerCase();

  // Allow for code blocks without a language.
  if (lang) {
    // sh isn't supported, use sh to match js, and ts
    if (lang in remapLanguages) {
      lang = remapLanguages[lang];
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

  return value?.title ? (
    <Snippet>
      <SnippetHeader title={value.title} Icon={getIconForFile(value.title)}>
        <CopyAction text={cleanCopyValue(value.value)} />
        <SettingsAction />
      </SnippetHeader>
      <SnippetContent className="p-0">
        <pre
          css={STYLES_CODE_CONTAINER}
          className={mergeClasses(wordWrap && '!whitespace-pre-wrap !break-words')}
          {...attributes}>
          <code
            css={STYLES_CODE_BLOCK}
            dangerouslySetInnerHTML={{ __html: html.replace(/^@@@.+@@@/g, '') }}
          />
        </pre>
      </SnippetContent>
    </Snippet>
  ) : (
    <pre
      css={[STYLES_CODE_CONTAINER, STYLES_CODE_CONTAINER_BLOCK]}
      className={mergeClasses(
        preferredTheme === Themes.DARK && 'dark-theme',
        wordWrap && '!whitespace-pre-wrap !break-words',
        'last:mb-0'
      )}
      {...attributes}>
      <code css={STYLES_CODE_BLOCK} dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  );
}

const STYLES_CODE_BLOCK = css`
  ${typography.body.code};
  color: ${theme.text.default};
  white-space: inherit;
  padding: 0;
  margin: 0;

  .code-annotation {
    transition: 200ms ease all;
    transition-property: text-shadow, opacity;
    text-shadow:
      ${theme.palette.yellow7} 0 0 10px,
      ${theme.palette.yellow7} 0 0 10px,
      ${theme.palette.yellow7} 0 0 10px,
      ${theme.palette.yellow7} 0 0 10px;
  }

  .code-annotation.with-tooltip:hover {
    cursor: pointer;
    animation: none;
    opacity: 0.8;
  }

  .code-hidden {
    display: none;
  }

  .code-placeholder {
    opacity: 0.5;
  }
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

const remapLanguages: Record<string, string> = {
  'objective-c': 'objc',
  sh: 'bash',
  rb: 'ruby',
};

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

type CodeBlockProps = React.PropsWithChildren<{ inline?: boolean; theme?: TextTheme }>;

export const CodeBlock = ({ children, theme, inline = false }: CodeBlockProps) => {
  const Element = inline ? 'span' : 'pre';
  return (
    <Element
      css={[
        STYLES_CODE_CONTAINER,
        codeBlockContainerStyle,
        inline && codeBlockInlineContainerStyle,
      ]}
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
