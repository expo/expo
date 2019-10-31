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
  constructor(props) {
    super(props);
    let isHidden;
    if (typeof window !== 'undefined') {
      isHidden = localStorage.getItem('isBannerHidden');
    } else {
      isHidden = false;
    }
    this.state = {
      isHidden,
    };
  }

  componentDidMount() {
    this._setBannerVisibility();
  }

  _setBannerVisibility = () => {
    if (typeof window !== 'undefined') {
      if (Date.parse(localStorage.getItem('hideDate')) <= this._sevenDaysAgo(new Date())) {
        this._showBannerAgain();
      } else {
        this.setState({ isHidden: localStorage.getItem('isBannerHidden') });
      }
    } else {
      this.setState({ isHidden: false });
    }
  };

  _sevenDaysAgo = day => {
    let pastDate = day.getDate() - 7;
    day.setDate(pastDate);
    return day;
  };

  _showBannerAgain = () => {
    localStorage.setItem('isBannerHidden', false);
    this.setState({ isHidden: false });
  };

  _handleHideBanner = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('isBannerHidden', true);
      localStorage.setItem('hideDate', new Date());
    }
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
