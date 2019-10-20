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

  blockquote {
    background: #fbfbfb;
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
  details summary h4 {
    font-size: 1.1rem;
    font-family: expo-brand-bold,sans-serif;
    display: inline;
  }
  details summary p {
    margin-top: 10px;
    margin-right: 15px;
    line-height: 1.725rem;
    letter-spacing: 0.2px;
  }
  details summary:hover {
    opacity: 0.75;
  }
  details p {
    margin-left: 15px;
  }
`;

