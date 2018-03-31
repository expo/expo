import React from 'react';
import Link from 'next/link';
import Logo from '~/components/icons/logo';
import AlgoliaSearch from '~/components/plugins/algolia-search';
import VersionSelector from '~/components/custom/version-selector';
import Button from '~/components/base/button';
import * as Constants from '~/style/constants';

class Header extends React.PureComponent {
  render() {
    return (
      <div>
        <header
          className="desktop header-desktop"
          style={{
            position: 'relative',
            maxWidth: 1440,
            display: 'flex',
            justifyContent: 'space-between',
            height: 65, // fix the height so no jumpiness
            margin: '0 auto',
            padding: '15px 30px 15px 20px',
            borderBottom: '1px solid #eee',
            backgroundColor: '#ffffff',
          }}>
          <Link prefetch href="/versions">
            <a className="logo">
              <Logo />
              {/* <span style={{ display: 'inline-block', marginLeft: '10px' }}>Documentation</span> */}
            </a>
          </Link>

          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <AlgoliaSearch router={this.props.router} activeVersion={this.props.activeVersion} />
            <VersionSelector
              activeVersion={this.props.activeVersion}
              setVersion={this.props.setVersion}
            />
          </div>
        </header>

        <header
          className="mobile"
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            background: `white`,
            padding: '20px',
            right: 0,
            top: 0,
            left: 0,
            zIndex: 1001,
            borderBottom: `1px solid #ccc`,
          }}>
          <Link prefetch href="/versions">
            <a className="logo">
              <Logo />
            </a>
          </Link>
          <Button onClick={this.props.toggleMobileOverlay} value="Menu" />
        </header>

        <style jsx>
          {`
            header.mobile {
              display: none;
            }

            a.logo {
              display: inline-block;
              position: relative;
              font-family: ${Constants.fontFamilies.demi};
              text-decoration: none;
              color: black;
              font-size: 24px;
              display: flex;
              align-items: center;
            }

            @media screen and (max-width: ${Constants.breakpoints.mobile}) {
              header.desktop {
                display: none !important;
              }

              header.mobile {
                display: flex;
                width: 100%;
              }

              .logo {
                margin-top: 5px;
                margin-left: 0px;
              }
            }
          `}
        </style>
      </div>
    );
  }
}

export default Header;
