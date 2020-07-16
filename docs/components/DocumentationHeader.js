import Link from 'next/link';
import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/common/constants';
import AlgoliaSearch from '~/components/plugins/AlgoliaSearch';

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
`;

const STYLES_NAV = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  background-color: white;
  z-index: 2;
  margin: 0 auto;
  padding: 0 16px;
  height: 60px;
  width: 100%;
  max-width: 1440px;

  @media screen and (max-width: ${Constants.breakpoints.mobileStrict}) {
    border-bottom: 1px solid ${Constants.expoColors.gray[250]};
  }
`;

const STYLES_MOBILE_NAV = css`
  padding: 0px;
  height: 56px;

  @media screen and (min-width: ${Constants.breakpoints.mobileStrict}) {
    display: none;
  }

  @media screen and (max-width: ${Constants.breakpoints.mobileStrict}) {
    border-bottom: none;
  }
`;

const STYLES_SEARCH_OVERLAY = css`
  @media screen and (max-width: ${Constants.breakpoints.mobileStrict}) {
    z-index: 1;
    position: fixed;
    top: 0px;
    left: 0px;
    right: 0px;
    bottom: 0px;
    opacity: 0.5;
    background-color: ${Constants.expoColors.black};
  }
`;

const STYLES_HIDDEN_ON_MOBILE = css`
  @media screen and (max-width: ${Constants.breakpoints.mobileStrict}) {
    display: none;
  }
`;

const SECTION_LINKS_WRAPPER = css`
  margin-left: 16px;

  @media screen and (max-width: ${Constants.breakpoints.mobileStrict}) {
    margin-left: 0px;
  }
`;

const STYLES_MENU_BUTTON_CONTAINER = css`
  display: grid;
  grid-gap: 12px;
  grid-auto-flow: column;
`;

const STYLES_MENU_BUTTON = css`
  display: none;
  cursor: pointer;
  height: 100%;
  align-items: center;
  justify-content: center;
  height: 40px;
  width: 40px;
  border-radius: 2px;

  :hover {
    background-color: ${Constants.expoColors.gray[100]};
  }

  @media screen and (max-width: ${Constants.breakpoints.mobileStrict}) {
    display: grid;
  }
`;

const SECTION_LINK = css`
  text-decoration: none;
  font-weight: 900;
  font-family: expo-brand-demi, sans-serif;

  padding: 0 16px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 2px;
  :hover {
    background-color: ${Constants.expoColors.gray[100]};
  }

  @media screen and (max-width: ${Constants.breakpoints.mobileStrict}) {
    height: 56px;
    border-radius: 0px;
  }
`;

const SECTION_LINK_ACTIVE = css`
  color: #000 !important;
  background-color: ${Constants.expoColors.gray[200]};
`;

const SECTION_LINK_INACTIVE = css`
  color: #000 !important;
`;

function SectionContainer({ spaceBetween = 0, spaceAround = 0, children, style, className }) {
  return (
    <div
      className={className}
      style={{ display: 'flex', paddingLeft: spaceAround, paddingRight: spaceAround, ...style }}>
      {children.map((child, i) => (
        <div key={i.toString()} style={{ paddingLeft: i === 0 ? 0 : spaceBetween }}>
          {child}
        </div>
      ))}
    </div>
  );
}

export default class DocumentationHeader extends React.PureComponent {
  render() {
    const HIDE_ON_MOBILE = true;
    const SHOW_ON_MOBILE = false;

    return (
      <div>
        <header className={STYLES_NAV}>
          <div className={STYLES_LEFT}>
            <div className={STYLES_LOGO_CONTAINER}>
              <Link href="/">
                <span className={STYLES_LOGO}>
                  <img src={'/static/images/header/docs-logo.svg'} />
                </span>
              </Link>

              {this._renderSectionLinks(HIDE_ON_MOBILE)}
            </div>
          </div>
          <div className={STYLES_RIGHT}>
            {!this.props.isAlogliaSearchHidden && (
              <AlgoliaSearch
                router={this.props.router}
                version={this.props.version}
                hiddenOnMobile={HIDE_ON_MOBILE}
              />
            )}

            {!this.props.isMenuActive && (
              <div className={STYLES_MENU_BUTTON_CONTAINER}>
                <span className={STYLES_MENU_BUTTON} onClick={this.props.onShowSearch}>
                  <img src={'/static/images/header/search.svg'} />
                </span>
                <span className={STYLES_MENU_BUTTON} onClick={this.props.onShowMenu}>
                  <img src={'/static/images/header/more-horizontal.svg'} />
                </span>
              </div>
            )}

            {this.props.isMenuActive && (
              <span className={STYLES_MENU_BUTTON} onClick={this.props.onHideMenu}>
                <img src={'/static/images/header/x.svg'} />
              </span>
            )}
          </div>
        </header>
        <header className={`${STYLES_NAV} ${STYLES_MOBILE_NAV}`}>
          {this.props.isMobileSearchActive ? (
            <AlgoliaSearch
              router={this.props.router}
              version={this.props.version}
              hiddenOnMobile={SHOW_ON_MOBILE}
              onHideSearch={this.props.onHideSearch}
              onStartMobileSearchText={this.props.onStartMobileSearchText}
            />
          ) : (
            this._renderSectionLinks(SHOW_ON_MOBILE)
          )}
        </header>
        <div className={`${this.props.isMobileSearchTextActive && STYLES_SEARCH_OVERLAY}`} />
      </div>
    );
  }

  _renderSectionLinks = hiddenOnMobile => {
    return (
      <div className={`${SECTION_LINKS_WRAPPER} ${hiddenOnMobile && STYLES_HIDDEN_ON_MOBILE}`}>
        <SectionContainer spaceBetween={hiddenOnMobile ? 8 : 0}>
          <Link href="/">
            <a
              className={`${SECTION_LINK} ${
                this.props.activeSection === 'starting'
                  ? SECTION_LINK_ACTIVE
                  : SECTION_LINK_INACTIVE
              } `}>
              Get Started
            </a>
          </Link>
          <Link href="/guides">
            <a
              className={`${SECTION_LINK}
                    ${
                      this.props.activeSection === 'general'
                        ? SECTION_LINK_ACTIVE
                        : SECTION_LINK_INACTIVE
                    }
                  `}>
              Guides
            </a>
          </Link>
          <Link href="/versions/latest/">
            <a
              className={`${SECTION_LINK}
                    ${
                      this.props.activeSection === 'reference'
                        ? SECTION_LINK_ACTIVE
                        : SECTION_LINK_INACTIVE
                    }
                  `}>
              API Reference
            </a>
          </Link>
        </SectionContainer>
      </div>
    );
  };
}
