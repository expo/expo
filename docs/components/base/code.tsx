import { css } from '@emotion/react';
import { borderRadius, spacing, theme, typography } from '@expo/styleguide';
import { Language, Prism } from 'prism-react-renderer';
import * as React from 'react';
import tippy, { roundArrow } from 'tippy.js';

import { installLanguages } from './languages';

// @ts-ignore Jest ESM issue https://github.com/facebook/jest/issues/9430
const { default: testTippy } = tippy;

installLanguages(Prism);

const attributes = {
  'data-text': true,
};

const STYLES_CODE_BLOCK = css`
  ${typography.body.code};
  color: ${theme.text.default};
  white-space: inherit;
  padding: 0;
  margin: 0;

  .code-annotation {
    transition: 200ms ease all;
    transition-property: text-shadow, opacity;
    text-shadow: ${theme.highlight.emphasis} 0 0 10px, ${theme.highlight.emphasis} 0 0 10px,
      ${theme.highlight.emphasis} 0 0 10px, ${theme.highlight.emphasis} 0 0 10px;
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

const STYLES_INLINE_CODE = css`
  ${typography.body.code};
  color: ${theme.text.default};
  white-space: pre-wrap;
  display: inline;
  padding: ${spacing[0.5]}px ${spacing[1]}px;
  max-width: 100%;
  word-wrap: break-word;
  background-color: ${theme.background.secondary};
  border: 1px solid ${theme.border.default};
  border-radius: ${borderRadius.small}px;
  vertical-align: middle;
  overflow-x: auto;

  /* Disable Safari from adding border when used within a (perma)link */
  a & {
    border-color: ${theme.border.default};
  }

  h2 &,
  h3 &,
  h4 & {
    position: relative;
    top: -2px;
  }
`;

const STYLES_CODE_CONTAINER = css`
  border: 1px solid ${theme.border.default};
  padding: 16px;
  margin: 16px 0;
  white-space: pre;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  background-color: ${theme.background.secondary};
  line-height: 120%;
  border-radius: 4px;
`;

type Props = {
  className?: string;
};

export class Code extends React.Component<React.PropsWithChildren<Props>> {
  componentDidMount() {
    this.runTippy();
  }

  componentDidUpdate() {
    this.runTippy();
  }

  private runTippy() {
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
  }

  private escapeHtml(text: string) {
    return text.replace(/"/g, '&quot;');
  }

  private replaceXmlCommentsWithAnnotations(value: string) {
    return value
      .replace(
        /<span class="token comment">&lt;!-- @info (.*?)--><\/span>\s*/g,
        (match, content) => {
          return content
            ? `<span class="code-annotation with-tooltip" data-tippy-content="${this.escapeHtml(
                content
              )}">`
            : '<span class="code-annotation">';
        }
      )
      .replace(
        /<span class="token comment">&lt;!-- @hide (.*?)--><\/span>\s*/g,
        (match, content) => {
          return `<span><span class="code-hidden">%%placeholder-start%%</span><span class="code-placeholder">${this.escapeHtml(
            content
          )}</span><span class="code-hidden">%%placeholder-end%%</span><span class="code-hidden">`;
        }
      )
      .replace(/\s*<span class="token comment">&lt;!-- @end --><\/span>(\n *)?/g, '</span>');
  }

  private replaceHashCommentsWithAnnotations(value: string) {
    return value
      .replace(/<span class="token comment"># @info (.*?)#<\/span>\s*/g, (match, content) => {
        return content
          ? `<span class="code-annotation with-tooltip" data-tippy-content="${this.escapeHtml(
              content
            )}">`
          : '<span class="code-annotation">';
      })
      .replace(/<span class="token comment"># @hide (.*?)#<\/span>\s*/g, (match, content) => {
        return `<span><span class="code-hidden">%%placeholder-start%%</span><span class="code-placeholder">${this.escapeHtml(
          content
        )}</span><span class="code-hidden">%%placeholder-end%%</span><span class="code-hidden">`;
      })
      .replace(/\s*<span class="token comment"># @end #<\/span>(\n *)?/g, '</span>');
  }

  private replaceSlashCommentsWithAnnotations(value: string) {
    return value
      .replace(/<span class="token comment">\/\* @info (.*?)\*\/<\/span>\s*/g, (match, content) => {
        return content
          ? `<span class="code-annotation with-tooltip" data-tippy-content="${this.escapeHtml(
              content
            )}">`
          : '<span class="code-annotation">';
      })
      .replace(/<span class="token comment">\/\* @hide (.*?)\*\/<\/span>\s*/g, (match, content) => {
        return `<span><span class="code-hidden">%%placeholder-start%%</span><span class="code-placeholder">${this.escapeHtml(
          content
        )}</span><span class="code-hidden">%%placeholder-end%%</span><span class="code-hidden">`;
      })
      .replace(/\s*<span class="token comment">\/\* @end \*\/<\/span>(\n *)?/g, '</span>');
  }

  render() {
    // note(simek): MDX dropped `inlineCode` pseudo-tag, and we need to relay on `pre` and `code` now,
    // which results in this nesting mess, we should fix it in the future
    const child = this.props.className
      ? this
      : (React.Children.toArray(this.props.children)[0] as JSX.Element);
    let html = child?.props?.children?.toString() || '';

    // mdx will add the class `language-foo` to codeblocks with the tag `foo`
    // if this class is present, we want to slice out `language-`
    let lang = child.props.className && child.props.className.slice(9).toLowerCase();

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
      if (['properties', 'ruby'].includes(lang)) {
        html = this.replaceHashCommentsWithAnnotations(html);
      } else if (['xml', 'html'].includes(lang)) {
        html = this.replaceXmlCommentsWithAnnotations(html);
      } else {
        html = this.replaceSlashCommentsWithAnnotations(html);
      }
    }

    return (
      <pre css={STYLES_CODE_CONTAINER} {...attributes}>
        <code css={STYLES_CODE_BLOCK} dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    );
  }
}

const remapLanguages: Record<string, string> = {
  'objective-c': 'objc',
  sh: 'bash',
  rb: 'ruby',
};

type InlineCodeProps = React.PropsWithChildren<{ className?: string }>;

export const InlineCode = ({ children, className }: InlineCodeProps) => (
  <code css={STYLES_INLINE_CODE} className={className ? `inline ${className}` : 'inline'}>
    {children}
  </code>
);

const codeBlockContainerStyle = {
  margin: 0,
  padding: `3px 6px`,
};

const codeBlockInlineContainerStyle = {
  display: 'inline-flex',
};

type CodeBlockProps = React.PropsWithChildren<{ inline?: boolean }>;

export const CodeBlock = ({ children, inline = false }: CodeBlockProps) => {
  const Element = inline ? 'span' : 'pre';
  return (
    <Element
      css={[
        STYLES_CODE_CONTAINER,
        codeBlockContainerStyle,
        inline && codeBlockInlineContainerStyle,
      ]}
      {...attributes}>
      <code css={[STYLES_CODE_BLOCK, { fontSize: '80%' }]}>{children}</code>
    </Element>
  );
};
