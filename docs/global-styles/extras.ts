import { css } from '@emotion/react';

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
