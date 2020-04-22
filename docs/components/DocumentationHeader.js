import Link from 'next/link';
import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/common/constants';
import BrandLogo from '~/components/icons/BrandLogo';
import DismissIcon from '~/components/icons/DismissIcon';
import MenuIcon from '~/components/icons/Menu';
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
  padding-top: 8px;
`;

const STYLES_NAV = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 58px;
  width: 100%;
  padding: 0 24px 0 24px;

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    padding: 0 16px 0 16px;
  }
`;

const STYLES_TITLE_TEXT = css`
  white-space: nowrap;
  padding: 0 0 0 8px;
  font-size: 1.3rem;
  display: flex;
  padding-bottom: 2px;
  font-family: ${Constants.fonts.demi};

  @media screen and (max-width: 400px) {
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

const SECTION_LINK_CONTAINER = css`
  display: flex;
`;

const SECTION_LINK = css`
  text-decoration: none;
  font-weight: 900;
  font-family: expo-brand-demi, sans-serif;
  :hover {
    opacity: 0.5;
  }
`;

const SECTION_LINK_ACTIVE = css`
  text-decoration: underline;
`;

const SECTION_LINK_INACTIVE = css`
  color: #000 !important;
`;

function SectionContainer({ spaceBetween = 0, spaceAround = 0, children, style }) {
  return (
    <div style={{ display: 'flex', paddingLeft: spaceAround, paddingRight: spaceAround, ...style }}>
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
    return (
      <header className={STYLES_NAV}>
        <div className={STYLES_LEFT}>
          <div className={STYLES_LOGO_CONTAINER}>
            <Link href="/">
              <a className={STYLES_LOGO}>
                <BrandLogo />
              </a>
            </Link>

            <h1 className={STYLES_TITLE_TEXT}>Expo</h1>

            <SectionContainer
              spaceBetween={15}
              style={{
                paddingLeft: 10,
                marginLeft: 15,
                borderLeftWidth: 1,
                borderLeftColor: '#eee',
                borderLeftStyle: 'solid',
              }}>
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
