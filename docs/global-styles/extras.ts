import { css } from '@emotion/react';
import { theme, typography } from '@expo/styleguide';
import { darkTheme } from '@expo/styleguide-base';

export const globalExtras = css`
  html {
    background: ${theme.background.default};
  }

  body {
    ${typography.body.paragraph}
    text-rendering: optimizeLegibility;
    line-height: 1;
  }

  *:focus-visible {
    outline: 3px solid ${theme.button.tertiary.icon};
    outline-offset: 1px;
    border-radius: 3px;
  }

  ::selection {
    background-color: rgb(from ${theme.palette.blue5} r g b / 80%);
    color: ${theme.text.default};
  }

  ::-moz-selection {
    background-color: ${theme.palette.blue5};
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

  code {
    font-variant-ligatures: none;
  }

  [cmdk-input] {
    outline: none;
  }
`;
