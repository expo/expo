import Link from 'next/link';

import * as React from 'react';
import * as Constants from '~/common/constants';

import Logo from '~/components/icons/logo';
import AlgoliaSearch from '~/components/plugins/algolia-search';
import VersionSelector from '~/components/custom/version-selector';
import Button from '~/components/base/button';

export default class Header extends React.PureComponent {
  render() {
    return (
      <header>
        <Link prefetch href="/versions">
          <a className="logo">
            <Logo />
          </a>
        </Link>
        <AlgoliaSearch router={this.props.router} activeVersion={this.props.activeVersion} />
        <VersionSelector
          activeVersion={this.props.activeVersion}
          setVersion={this.props.setVersion}
        />
      </header>
    );
  }
}
