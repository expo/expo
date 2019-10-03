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


  details {
    margin-bottom: 20px;
    padding-top: 20px;
  }

  details summary {
    outline: none;
    cursor: pointer;
    margin-bottom: 15px;
  }

  details summary h3 {
    font-size: 1.2rem;
    font-family: expo-brand-bold,sans-serif;
    display: inline;
  }

  details summary p {
    margin-top: 10px;
  }

  details summary:hover {
    opacity: 0.7;
  }

  details p {
    margin-left: 15px;
  }
`;
