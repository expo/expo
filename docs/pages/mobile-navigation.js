import styled, { keyframes, css } from 'react-emotion';
import _ from 'lodash';

import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Utilities from '~/common/utilities';
import { VERSIONS, LATEST_VERSION } from '~/common/versions';

import NavigationJSON from '~/generated/navigation-data.json';

import DocumentationHeader from '~/components/DocumentationHeader';
import DocumentationSidebar from '~/components/DocumentationSidebar';
import Head from '~/components/Head';

const STYLES_MOBILE_HEADER = css`
  border-bottom: 1px solid ${Constants.colors.border};
`;

export default class MobileNavigation extends React.Component {
  static getInitialProps(ctx) {
    let version = LATEST_VERSION;

    if (!process.browser && ctx.query.version) {
      version = ctx.query.version;
    }

    const routes = _.find(NavigationJSON, {
      version:
        version !== 'latest' ? version.replace('.0.0', '') : LATEST_VERSION.replace('.0.0', ''),
    }).navigation;

    return {
      routes,
      version,
    };
  }

  render() {
    const canonicalUrl = `https://docs.expo.io${Utilities.replaceVersionInUrl(
      this.props.url.pathname,
      'latest'
    )}`;

    return (
      <div>
        <Head title={`${this.props.title} - Expo Index`} />
        <div className={STYLES_MOBILE_HEADER}>
          <DocumentationHeader
            activeVersion={this.props.version}
            isMenuActive
            hideAlgoliaSearch
            hideVersionSelector
          />
        </div>
        <DocumentationSidebar routes={this.props.routes} activeVersion={this.props.version} />
      </div>
    );
  }
}
