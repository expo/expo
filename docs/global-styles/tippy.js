import * as Constants from '~/common/constants';

export const globalTippy = `
  div.tippy-tooltip {
    font-size: 0.9rem;
    line-height: 1.625rem;
    padding: 16px;
    color: ${Constants.colors.white};
    background-color: ${Constants.colors.black};
    color: black;
    text-align: left;
  }

  .tippy-popper[x-placement^='top'] .tippy-tooltip .tippy-roundarrow {
    fill: ${Constants.colors.black};
  }

  .tippy-tooltip.expo-theme .tippy-content {
    font-size: 1rem;
    line-height: 1.725rem;
    color: ${Constants.colors.white};
    font-family: ${Constants.fonts.book};
  }

  .tippy-content a {
    color: #eee;
  }
`;
