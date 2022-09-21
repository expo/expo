import { css } from '@emotion/react';
import { darkTheme, theme, typography } from '@expo/styleguide';

export const globalExtras = css`
  html {
    background: ${theme.background.default};
  }

  body {
    ${typography.body.paragraph}
    font-family: ${typography.fontFaces.regular};
    text-rendering: optimizeLegibility;
    line-height: 1;
  }

  ::selection {
    background-color: ${theme.highlight.accent};
    color: ${theme.text.default};
  }
  
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    backgroundColor: transparent,
    cursor: pointer,
  }

  ::-webkit-scrollbar-thumb {
    background: ${theme.background.tertiary};
    border-radius: 10px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${theme.background.quaternary};
  }
  
  html[data-expo-theme="light"] div[class*="SnippetContent"] {
    ::-webkit-scrollbar-thumb {
      background: ${darkTheme.background.quaternary};
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: ${darkTheme.icon.secondary};
    }
  }

  a {
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    color: ${theme.link.default};
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

  // TODO: investigate why some style is forcing nested ordered lists to have
  // 1rem bottom margin!
  ul ul,
  ol ul {
    margin-bottom: 0 !important;
  }
`;
