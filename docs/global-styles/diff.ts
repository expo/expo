import { css } from '@emotion/react';
import { theme, typography } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';

// Global styles for react-diff-view
export const globalDiff = css`
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
    user-select: none;
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
