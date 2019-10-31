import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/common/constants';

const STYLES_ALERT = css`
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 24px;
  line-height: 1.4;
  color: ${Constants.colors.white};
  background: ${Constants.colors.black};
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  overflow: hidden;
`;

const STYLES_ALERT_BOLD = css`
  color: ${Constants.colors.white};
  font-family: ${Constants.fontFamilies.demi};
`;

const STYLES_CLOSE_BUTTON = css`
  float: right;
  position: relative;
  width: 20px;
  height: 20px;
  background: ${Constants.colors.black};
  border: 0;
  ::before,
  ::after {
    position: absolute;
    left: 0px;
    width: 18px;
    height: 2px;
    content: '';
    background-color: ${Constants.colors.white};
  }
  ::before {
    transform: rotate(45deg);
  }
  ::after {
    transform: rotate(-45deg);
  }
  :focus {
    outline: none;
  }
  :hover {
    cursor: pointer;
  }
`;

export default class Banner extends React.Component {
  state = {
    isHidden: true,
  };

  componentDidMount() {
    this._setBannerVisibility();
  }

  _setBannerVisibility = () => {
    let hideDate =
      localStorage.getItem('hideDate') && new Date(parseInt(localStorage.getItem('hideDate'), 10));
    let isBannerHidden = !!localStorage.getItem('isBannerHidden');
    let sevenDaysAgo = this._sevenDaysAgo();

    if (hideDate && hideDate <= sevenDaysAgo) {
      this._showBannerAgain();
    } else {
      this.setState({ isHidden: isBannerHidden });
    }
  };

  _sevenDaysAgo = () => {
    return new Date(new Date() - 60 * 60 * 24 * 7 * 1000);
  };

  _showBannerAgain = () => {
    localStorage.removeItem('hideDate');
    localStorage.removeItem('isBannerHidden');
    this.setState({ isHidden: false });
  };

  _handleHideBanner = () => {
    localStorage.setItem('isBannerHidden', true);
    localStorage.setItem('hideDate', new Date().getTime());
    this.setState({ isHidden: true });
  };

  render() {
    if (this.state.isHidden) {
      return null;
    } else {
      return (
        <div className={STYLES_ALERT}>
          <strong className={STYLES_ALERT_BOLD}>Hey friend!</strong> We are co-hosting a conference
          with <strong className={STYLES_ALERT_BOLD}>Software Mansion</strong>,{' '}
          <a
            className={STYLES_ALERT_BOLD}
            style={{ color: Constants.colors.lila }}
            href="https://appjs.co/?utm_source=organic%20traffic&utm_medium=expo%20website&utm_campaign=docs.expo.io"
            target="blank">
            learn more
          </a>
          .
          <button type="button" className={STYLES_CLOSE_BUTTON} onClick={this._handleHideBanner} />
        </div>
      );
    }
  }
}
