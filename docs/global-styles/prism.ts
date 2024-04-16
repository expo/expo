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
    color: ${theme.palette.gray10};
  }

  .token.operator,
  .token.punctuation {
    color: ${theme.palette.gray9};
  }

  .token.attr-name,
  .token.boolean,
  .token.function-name,
  .token.constant,
  .token.symbol,
  .token.deleted {
    color: ${theme.palette.red11};
  }

  .token.selector,
  .token.char,
  .token.builtin,
  .token.script,
  .token.inserted {
    color: ${theme.palette.green10};
  }

  .token.entity,
  .token.variable {
    color: ${theme.palette.green11};
  }

  .token.keyword {
    color: ${theme.palette.pink10};
  }

  .token.property,
  .token.atrule,
  .token.attr-value,
  .token.function {
    color: ${theme.palette.purple11};
  }

  .token.class-name,
  .token.regex,
  .token.important,
  .token.tag {
    color: ${theme.palette.orange11};
  }

  .token.number,
  .token.string {
    color: ${theme.palette.yellow11};
  }

  .token.url,
  .token.literal-property,
  .token.property-access {
    color: ${theme.palette.blue11};
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
    color: ${theme.palette.gray9};
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

  .terminal-snippet {
    .token.property,
    .token.atrule,
    .token.attr-value,
    .token.function {
      color: ${theme.palette.pink10};
    }
  }
`;
