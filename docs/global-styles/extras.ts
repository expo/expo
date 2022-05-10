import { css } from '@emotion/react';
import { theme, palette, typography } from '@expo/styleguide';

export const globalExtras = css`
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

  .snack-inline-example-button {
    display: grid;
    grid-template-columns: 16px 1fr;
    grid-gap: 8px;
    align-items: center;
    border: none;
    border-radius: 4px;
    padding: 0 16px;
    height: 40px;
    margin: 0;
    margin-bottom: 0.5rem;
    text-decoration: none;
    background: ${theme.button.primary.background};
    color: ${palette.dark.white};
    font-family: ${typography.fontFaces.regular};
    font-size: 1rem;
    cursor: pointer;
    -webkit-appearance: none;
    -moz-appearance: none;
    transition: all 170ms linear;
  }

  .snack-inline-example-button:hover,
  .snack-inline-example-button:focus {
    box-shadow: 0 2px 8px rgba(0, 1, 0, 0.2);
    opacity: 0.85;
  }

  .snack-inline-example-button:focus {
    outline: 0;
    border: 0;
  }

  .snack-inline-example-button:active {
    outline: 0;
    border: 0;
  }

  .diff-container {
    border: 1px solid ${theme.border.default};
    border-radius: 2px;
    margin-bottom: 10px;
  }

  .diff-container table {
    font-size: 0.9rem;
    border-radius: none;
    border: none;
  }

  .diff-container td,
  .diff-container th {
    border-bottom: none;
    border-right: none;
  }

  .diff-container .diff-gutter-insert {
    background: ${theme.background.success};
  }

  .diff-container .diff-gutter-delete {
    background: ${theme.background.error};
  }

  .diff-container .diff-code-insert {
    background: ${theme.background.success};
  }

  .diff-container .diff-code-delete {
    background: ${theme.background.error};
  }

  .strike {
    text-decoration: line-through;
  }

  // TODO: investigate why some style is forcing nested ordered lists to have
  // 1rem bottom margin!
  ul ul,
  ol ul {
    margin-bottom: 0 !important;
  }
`;
