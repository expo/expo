import Prism from 'prism-react-renderer/prism';
import * as React from 'react';
import { css } from 'react-emotion';
import * as Constants from '~/common/constants';

import { installLanguages } from './languages';

installLanguages(Prism);

const attributes = {
  'data-text': true,
};

const STYLES_CODE_BLOCK = css`
  color: ${Constants.colors.black80};
  font-family: ${Constants.fontFamilies.mono};
  font-size: 13px;
  line-height: 20px;
  white-space: inherit;
  padding: 0px;
  margin: 0px;

  .code-annotation {
    transition: 200ms ease all;
    transition-property: text-shadow, opacity;
    text-shadow: rgba(255, 255, 0, 1) 0px 0px 10px, rgba(255, 255, 0, 1) 0px 0px 10px,
      rgba(255, 255, 0, 1) 0px 0px 10px, rgba(255, 255, 0, 1) 0px 0px 10px;
  }

  .code-annotation:hover {
    cursor: pointer;
    animation: none;
    opacity: 0.8;
  }
`;

const STYLES_INLINE_CODE = css`
  color: ${Constants.expoColors.gray[900]};
  font-family: ${Constants.fontFamilies.mono};
  font-size: 0.9rem;
  white-space: pre-wrap;
  display: inline;
  padding: 1px 4px;
  margin: 2px;
  position: relative;
  top: -1px;
  line-height: 20px;
  max-width: 100%;

  word-wrap: break-word;
  background-color: ${Constants.expoColors.gray[200]};
  border-radius: 2px;
  vertical-align: middle;
  overflow-x: scroll;

  ::before {
    content: '';
  }

  ::after {
    content: '';
  }
`;

const STYLES_CODE_CONTAINER = css`
  border: 1px solid ${Constants.colors.border};
  padding: 24px;
  margin: 16px 0 16px 0;
  white-space: pre;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  background-color: rgba(0, 1, 31, 0.03);
  line-height: 1.2rem;
`;

export class Code extends React.Component {
  componentDidMount() {
    this._runTippy();
  }

  componentDidUpdate() {
    this._runTippy();
  }

  _runTippy() {
    if (process.browser) {
      global.tippy('.code-annotation', {
        theme: 'expo',
        placement: 'top',
        arrow: true,
        arrowType: 'round',
        interactive: true,
        distance: 20,
      });
    }
  }

  _escapeHtml(text) {
    return text.replace(/"/g, '&quot;');
  }

  _replaceCommentsWithAnnotations(value) {
    return value
      .replace(/<span class="token comment">\/\* @info (.*?)\*\/<\/span>\s*/g, (match, content) => {
        return `<span class="code-annotation" title="${this._escapeHtml(content)}">`;
      })
      .replace(/<span class="token comment">\/\* @end \*\/<\/span>(\n *)?/g, '</span>');
  }

  render() {
    let html = this.props.children.toString();
    // mdx will add the class `language-foo` to codeblocks with the tag `foo`
    // if this class is present, we want to slice out `language-`
    let lang = this.props.className && this.props.className.slice(9).toLowerCase();

    // Allow for code blocks without a language.
    if (lang) {
      // sh isn't supported, use Use sh to match js, and ts
      if (lang in remapLanguages) lang = remapLanguages[lang];
      const grammar = Prism.languages[lang];
      if (!grammar) throw new Error(`docs currently do not support language: ${lang}`);
      html = Prism.highlight(html, grammar);
      html = this._replaceCommentsWithAnnotations(html);
    }

    // Remove leading newline if it exists (because inside <pre> all whitespace is dislayed as is by the browser, and
    // sometimes, Prism adds a newline before the code)
    if (html.startsWith('\n')) {
      html = html.replace('\n', '');
    }

    return (
      <pre className={STYLES_CODE_CONTAINER} {...attributes}>
        <code className={STYLES_CODE_BLOCK} dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    );
  }
}

const remapLanguages = {
  'objective-c': 'objc',
  sh: 'bash',
  rb: 'ruby',
};

export const InlineCode = ({ children }) => (
  <code className={`${STYLES_INLINE_CODE} inline`}>{children}</code>
);
