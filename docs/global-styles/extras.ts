import { css } from '@emotion/core';

import * as Constants from '~/constants/theme';

export const globalExtras = css`
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
    margin-bottom: 1rem;
    padding-top: 1rem;
  }

  details summary {
    outline: none;
    cursor: pointer;
    margin-bottom: 0.5rem;
  }

  details summary h3 {
    font-size: 1.2rem;
    font-weight: 500;
    font-family: ${Constants.fonts.demi};
    color: ${Constants.colors.black90};
    display: inline-block;
  }

  details summary h4 {
    font-family: ${Constants.fonts.demi};
    color: ${Constants.colors.black90};
    font-size: 1.1rem;
    font-weight: 500;
    display: inline-block;
  }

  details summary p {
    margin-top: 0.5rem;
    margin-right: 1rem;
    line-height: 160%;
  }

  details summary:hover {
    opacity: 0.75;
  }

  details p {
    margin-left: 1rem;
  }

  details summary .anchor-icon {
    display: none;
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
    background: ${Constants.expoColors.primary[500]};;
    color: ${Constants.expoColors.white};;
    font-family: ${Constants.fontFamilies.book};;
    font-size: 1rem;
    cursor: pointer;
    -webkit-appearance: none;
    -moz-appearance: none;
    transition: all 170ms linear;
  }

  .snack-inline-example-button:hover, .snack-inline-example-button:focus  {
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
    border: 1px solid #e3e3e3;
    border-radius: 2px;
    margin-bottom: 10px;
  }

  .diff-container table {
    font-size: 0.9rem;
    border-radius: none;
    border: none;
  }

  .diff-container td, .diff-container th {
    border-bottom: none;
    border-right: none;
  }
`;
