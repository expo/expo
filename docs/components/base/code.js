import React from 'react';
import Prism from 'prismjs';

import * as Constants from '~/style/constants';

/* global tippy */

export class Code extends React.Component {
  componentDidMount() {
    this._runTippy();
  }

  componentDidUpdate() {
    this._runTippy();
  }

  _runTippy() {
    if (process.browser) {
      tippy('.code-annotation', {
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
    let code = this.props.children;
    let { lang } = this.props;
    let html = code.toString();
    if (lang && !Prism.languages[lang]) {
      try {
        require('prismjs/components/prism-' + lang + '.js');
      } catch (e) {}
    }
    if (lang && Prism.languages[lang]) {
      html = Prism.highlight(html, Prism.languages[lang]);
      html = this._replaceCommentsWithAnnotations(html);
    }

    // Remove leading newline if it exists (because inside <pre> all whitespace is dislayed as is by the browser, and
    // sometimes, Prism adds a newline before the code)
    if (html.startsWith('\n')) {
      html = html.replace('\n', '');
    }

    return (
      <pre
        style={{
          border: '1px solid #eaeaea',
          padding: '20px',
          margin: '10px 0',
          whiteSpace: 'pre',
          overflow: 'auto',
          maxWidth: '850px',
          WebkitOverflowScrolling: 'touch',
          backgroundColor: 'rgba(0, 1, 31, 0.03)',
          lineHeight: '1.2rem',
        }}>
        <code dangerouslySetInnerHTML={{ __html: html }} />
        <style jsx>
          {`
            code {
              color: ${Constants.colors.black80};
              font-family: ${Constants.fontFamilies.mono};
              font-size: 13px;
              line-height: 20px;
              white-space: inherit;
              padding: 0px;
              margin: 0px;
            }
          `}
        </style>
        <style jsx global>
          {`
            /* Code annotation styles */
            .code-annotation {
              font-weight: 600;
            }

            .code-annotation:hover {
              cursor: pointer;
              opacity: 0.6;
              animation: none;
            }

            .tippy-tooltip.expo-theme {
              background-color: white;
              color: black;
              text-align: left;
            }

            .tippy-popper[x-placement^='top'] .tippy-tooltip.expo-theme .tippy-roundarrow {
              fill: white;
            }

            .tippy-tooltip.expo-theme .tippy-content {
              padding: 10px 5px;
              line-height: 1.5em;
              font-family: ${Constants.fonts.book};
            }
          `}
        </style>
      </pre>
    );
  }
}

export const InlineCode = ({ children }) => (
  <code className="inline">
    {children}
    <style jsx global>
      {`
        code {
          color: ${Constants.colors.black80};
          font-family: ${Constants.fontFamilies.mono};
          font-size: 0.9rem;
          white-space: pre-wrap;
          display: inline;
          padding: 4px;
          margin: 2px;
          line-height: 20px;
          max-width: 100%;
        }

        code.inline {
          word-wrap: break-word;
          background-color: ${Constants.colors.blackRussian};
          vertical-align: middle;
          overflow-x: scroll;
        }

        code::before {
          content: '';
          /* content: '\`'; */
        }

        code::after {
          /* content: '\`'; */
          content: '';
        }
      `}
    </style>
  </code>
);
