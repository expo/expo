import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';

export const globalPrism = css`
  :not(pre) > code[class*='language-'],
  pre[class*='language-'] {
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
    margin-bottom: 1em;
  }

  :not(pre) > code[class*='language-'] {
    position: relative;
    padding: 0.2em;
    border-radius: 0.3em;
    color: color: ${theme.code.property};
    border: 1px solid ${theme.border.default};
    display: inline;
    white-space: normal;
  }

  pre[class*='language-']:before,
  pre[class*='language-']:after {
    content: '';
    z-index: -2;
    display: block;
    position: absolute;
    bottom: 0.75em;
    left: 0.18em;
    width: 40%;
    height: 20%;
    max-height: 13em;
  }

  :not(pre) > code[class*='language-']:after,
  pre[class*='language-']:after {
    right: 0.75em;
    left: auto;
    -webkit-transform: rotate(2deg);
    -moz-transform: rotate(2deg);
    -ms-transform: rotate(2deg);
    -o-transform: rotate(2deg);
    transform: rotate(2deg);
  }

  .token.comment,
  .token.block-comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: ${theme.code.comment}
  }

  .token.punctuation {
    color: ${theme.code.punctuation}
  }

  .token.property,
  .token.tag,
  .token.boolean,
  .token.number,
  .token.function-name,
  .token.constant,
  .token.symbol,
  .token.deleted {
    color: ${theme.code.property}
  }

  .token.selector,
  .token.attr-name,
  .token.string,
  .token.char,
  .token.function,
  .token.builtin,
  .token.inserted {
    color: ${theme.code.builtin}
  }

  .token.operator,
  .token.entity,
  .token.url,
  .token.variable {
    color: ${theme.code.operator}
  }

  .token.atrule,
  .token.attr-value,
  .token.keyword,
  .token.class-name {
    color: ${theme.code.keyword}
  }

  .token.regex,
  .token.important {
    color: ${theme.code.regex}
  }

  .language-css .token.string,
  .style .token.string {
    color: ${theme.code.string}
  }

  .token.important {
    font-weight: normal;
  }

  .token.bold {
    font-weight: bold;
  }
  .token.italic {
    font-style: italic;
  }

  .token.entity {
    cursor: help;
  }

  .namespace {
    opacity: 0.7;
  }

  @media screen and (max-width: 767px) {
    pre[class*='language-']:before,
    pre[class*='language-']:after {
      bottom: 14px;
      box-shadow: none;
    }
  }

  .token.tab:not(:empty):before,
  .token.cr:before,
  .token.lf:before {
    color: ${theme.code.before}
  }

  pre[class*='language-'].line-numbers {
    padding-left: 0;
  }

  pre[class*='language-'].line-numbers code {
    padding-left: 3.8em;
  }

  pre[class*='language-'].line-numbers .line-numbers-rows {
    left: 0;
  }

  pre[class*='language-'][data-line] {
    padding-top: 0;
    padding-bottom: 0;
    padding-left: 0;
  }
  pre[data-line] code {
    position: relative;
    padding-left: 4em;
  }
  pre .line-highlight {
    margin-top: 0;
  }
`;
