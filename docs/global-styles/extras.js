import * as Constants from '~/common/constants';

export const globalExtras = `
  img.wide-image {
    max-width: 900px;
  }

  img[src*="https://placehold.it/15"] {
    width: 15px !important;
    height: 15px !important;
  }

  .react-player > video {
    outline: none;
  }
`;
