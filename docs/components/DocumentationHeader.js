import styled, { keyframes, css } from 'react-emotion';
import Link from 'next/link';

import * as React from 'react';
import * as Constants from '~/common/constants';

import Logo from '~/components/icons/logo';
import AlgoliaSearch from '~/components/plugins/algolia-search';
import VersionSelector from '~/components/custom/version-selector';

const STYLES_LEFT = css`
  flex-shrink: 0;
  padding-right: 24px;
`;

const STYLES_RIGHT = css`
  min-width: 5%;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const STYLES_NAV = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  max-width: 1248px;
  padding: 0 24px 0 24px;
  margin: 0 auto 0 auto;
`;

export default class DocumentationHeader extends React.PureComponent {
  render() {
    return (
      <header className={STYLES_NAV}>
        <div className={STYLES_LEFT}>
          <Link prefetch href="/versions">
            <a className="logo">
              <Logo />
            </a>
          </Link>
        </div>
        <div className={STYLES_RIGHT}>
          <AlgoliaSearch router={this.props.router} activeVersion={this.props.activeVersion} />
          <VersionSelector
            style={{ marginLeft: 16, height: 32 }}
            activeVersion={this.props.activeVersion}
            setVersion={this.props.setVersion}
          />
        </div>
      </header>
    );
  }
}
