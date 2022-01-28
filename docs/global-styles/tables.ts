import { css } from '@emotion/react';
import { theme, typography } from '@expo/styleguide';

export const globalTables = css`
  table {
    margin-bottom: 1rem;
    font-size: 0.8rem;
    border-collapse: collapse;
    border: 1px solid ${theme.border.default};
    border-radius: 4px;
    width: 100%;
  }

  thead {
    border-radius: 4px;
    text-align: left;
    background: ${theme.background.tertiary};
  }

  td,
  th {
    padding: 16px;
    border-bottom: 1px solid ${theme.border.default};
    border-right: 1px solid ${theme.border.default};
    color: ${theme.text.default};

    :last-child {
      border-right: 0px;
    }
  }

  td {
    text-align: left;

    li,
    blockquote {
      font-size: 0.8rem !important;
    }
  }

  th {
    font-family: ${typography.fontFaces.semiBold};
    font-weight: 400;
  }
`;
