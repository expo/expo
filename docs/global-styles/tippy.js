import * as Constants from '~/common/constants';

export const globalTippy = `
  .tippy-tooltip.expo-theme {
    font-size: 0.9rem;
    line-height: 1.625rem;
    padding: 16px;
    color: ${Constants.colors.white};
    background-color: ${Constants.colors.black};
    text-align: left;

    .tippy-roundarrow {
      fill: ${Constants.colors.black};
    }
    .tippy-content {
      font-size: 1rem;
      line-height: 1.725rem;
      color: ${Constants.colors.white};
      font-family: ${Constants.fonts.book};
    }
  }


`;
