import { css } from '@emotion/react';
import { darkTheme, spacing, theme, typography } from '@expo/styleguide';

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
    background: ${theme.background.element};
    border-radius: 10px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${theme.background.hover};
  }

  html[data-expo-theme='light'] div[class*='SnippetContent'] {
    ::-webkit-scrollbar-thumb {
      background: ${darkTheme.background.hover};
    }

    ::-webkit-scrollbar-thumb:hover {
      background: ${darkTheme.icon.secondary};
    }
  }

  a {
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    color: ${theme.text.link};
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

  // TODO(simek): investigate why some style is forcing nested ordered lists to have 1rem bottom margin!
  ul ul,
  ol ul {
    margin-bottom: 0 !important;
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
