import { css } from '@emotion/react';
import { theme, typography } from '@expo/styleguide';
import { darkTheme, spacing } from '@expo/styleguide-base';

export const globalExtras = css`
  html {
    background: ${theme.background.default};
  }

  body {
    ${typography.body.paragraph}
    text-rendering: optimizeLegibility;
    line-height: 1;
  }

  ::selection {
    background-color: ${theme.palette.blue5};
    color: ${theme.text.default};
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background-color: transparent;
    cursor: pointer;
  }

  ::-webkit-scrollbar-thumb {
    background: ${theme.palette.gray5};
    border-radius: 10px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${theme.palette.gray6};
  }

  div[class*='Terminal'] > div {
    ::-webkit-scrollbar-thumb {
      background: ${darkTheme.icon.quaternary};
    }

    ::-webkit-scrollbar-thumb:hover {
      background: ${darkTheme.icon.tertiary};
    }
  }

  img {
    max-width: 768px;
    width: 100%;
  }

  img.wide-image {
    max-width: 900px;
  }

  img[src*="https://placehold.it/15"]
  {
    width: 15px !important;
    height: 15px !important;
  }

  .react-player > video {
    outline: none;
  }

  .strike {
    text-decoration: line-through;
  }

  // Global styles for react-diff-view

  .diff-unified {
    ${typography.fontSizes[13]};
    border-collapse: collapse;
    white-space: pre-wrap;
    width: 100%;

    td,
    th {
      border-bottom: none;
    }
  }

  .diff-line:first-of-type {
    height: 29px;

    td {
      padding-top: ${spacing[2]}px;
    }
  }

  .diff-line:last-of-type {
    height: 29px;
  }

  .diff-gutter-col {
    width: ${spacing[10]}px;
    background-color: ${theme.background.element};
  }

  .diff-gutter {
    ${typography.fontSizes[12]};
    text-align: right;
    padding: 0 ${spacing[2]}px;
  }

  .diff-gutter-normal {
    color: ${theme.icon.secondary};
  }

  .diff-code {
    word-break: break-word;
    padding-left: ${spacing[4]}px;
  }

  .diff-code-insert {
    background-color: ${theme.palette.green2};
    color: ${theme.text.success};
  }

  .diff-gutter-insert {
    background-color: ${theme.palette.green4};
    color: ${theme.text.success};
  }

  .diff-code-delete {
    background-color: ${theme.palette.red2};
    color: ${theme.text.danger};
  }

  .diff-gutter-delete {
    background-color: ${theme.palette.red4};
    color: ${theme.text.danger};
  }
`;
