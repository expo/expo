import styled, { keyframes, css } from 'react-emotion';
import Link from 'next/link';

import * as React from 'react';
import * as Constants from '~/common/constants';

import BrandLogo from '~/components/icons/BrandLogo';
import MenuIcon from '~/components/icons/Menu';
import DismissIcon from '~/components/icons/DismissIcon';
import AlgoliaSearch from '~/components/plugins/AlgoliaSearch';
import VersionSelector from '~/components/VersionSelector';

const STYLES_LOGO = css`
  display: flex;
`;

const STYLES_LEFT = css`
  flex-shrink: 0;
  padding-right: 24px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const STYLES_RIGHT = css`
  min-width: 5%;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const STYLES_LOGO_CONTAINER = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-top: 8px;
`;

const STYLES_NAV = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  width: 100%;
  padding: 0 24px 0 24px;

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    padding: 0 16px 0 16px;
  }
`;

const STYLES_TITLE_TEXT = css`
  width: 170px;
  white-space: nowrap;
  padding: 0 0 0 8px;
  font-size: 1.3rem;
  display: flex;
  padding-bottom: 2px;
  font-family: ${Constants.fonts.demi};

  @media screen and (max-width: 340px) {
    display: none;
  }
`;

const STYLES_MENU_BUTTON = css`
  cursor: pointer;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding-left: 24px;
  margin-left: 16px;
  border-left: 1px solid ${Constants.colors.border};
  text-decoration: none;
  color: ${Constants.colors.black};

  :visited {
    color: ${Constants.colors.black};
  }

  :hover {
    color: ${Constants.colors.expo};
  }

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    padding-left: 16px;
  }
`;

const STYLES_MENU_BUTTON_IS_MOBILE = css`
  display: none;

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    display: flex;
  }
`;

const STYLES_MENU_BUTTON_VISIBLE = css`
  display: flex;
`;

export default class DocumentationHeader extends React.PureComponent {
  render() {
    return (
      <header className={STYLES_NAV}>
        <div className={STYLES_LEFT}>
          <div className={STYLES_LOGO_CONTAINER}>
            <Link prefetch href="/versions/">
              <a className={STYLES_LOGO}>
                <BrandLogo />
              </a>
            </Link>

            <h1 className={STYLES_TITLE_TEXT}>Documentation</h1>
          </div>

          {!this.props.isVersionSelectorHidden && (
            <VersionSelector version={this.props.version} onSetVersion={this.props.onSetVersion} />
          )}
        </div>
        <div className={STYLES_RIGHT}>
          {!this.props.isAlogliaSearchHidden && (
            <AlgoliaSearch router={this.props.router} version={this.props.version} />
          )}

          {!this.props.isMenuActive && (
            <span
              className={`${STYLES_MENU_BUTTON} ${STYLES_MENU_BUTTON_IS_MOBILE}`}
              onClick={this.props.onShowMenu}>
              <MenuIcon />
            </span>
          )}

          {this.props.isMenuActive && (
            <span
              className={`${STYLES_MENU_BUTTON} ${STYLES_MENU_BUTTON_VISIBLE}`}
              onClick={this.props.onHideMenu}>
              <DismissIcon />
            </span>
          )}
        </div>
      </header>
    );
  }
}
