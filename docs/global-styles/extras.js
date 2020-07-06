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

  .snack-inline-example-button {
    display: inline-block;
    border: none;
    border-radius: 3px;
    padding: 0.8rem 1rem;
    margin: 0;
    margin-bottom: 0.5rem;
    text-decoration: none;
    background: #5844ed;
    color: #ffffff;
    font-family: sans-serif;
    font-size: 1rem;
    cursor: pointer;
    text-align: center;
    transition: background 250ms ease-in-out, 
                transform 150ms ease;
    -webkit-appearance: none;
    -moz-appearance: none;
  }

  .snack-inline-example-button:hover, .snack-inline-example-button:focus  {
    background: #322596;
  }

  .snack-inline-example-button:focus {
      outline: 1px solid #fff;
      outline-offset: -4px;
  }

  .snack-inline-example-button:active {
      transform: scale(0.99);
  }
`;
