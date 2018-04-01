import _ from 'lodash';
import Router from 'next/router';
import styled, { keyframes, css } from 'react-emotion';

import * as React from 'react';
import * as Utilities from '~/common/utilities';
import { VERSIONS, LATEST_VERSION } from '~/common/versions';

import NavigationJSON from '~/generated/navigation-data.json';

import DocumentationHeader from '~/components/DocumentationHeader';
import DocumentationFooter from '~/components/DocumentationFooter';
import DocumentationPageLayout from '~/components/DocumentationPageLayout';
import DocumentationSidebar from '~/components/DocumentationSidebar';
import Head from '~/components/Head';
import { H1 } from '~/components/base/headings';

const STYLES_DOCUMENT = css`
  padding: 24px;
`;

const mutateRouteDataForRender = data => {
  data.forEach(element => {
    if (element.href) {
      element.as = Utilities.replaceVersionInUrl(element.href, 'latest');
    }

    if (element.posts) {
      mutateRouteDataForRender(element.posts);
    }
  });
};

export default class DocumentationPage extends React.Component {
  componentDidMount() {
    Router.onRouteChangeStart = () => {
      window.NProgress.start();
    };

    Router.onRouteChangeComplete = () => {
      window.NProgress.done();
    };

    Router.onRouteChangeError = () => {
      window.NProgress.done();
    };
  }

  render() {
    // TODO(jim): Theres too much state management occuring at the render.
    // This needs to be moved elsewhere.
    let version = (this.props.asPath || this.props.url.pathname).split(`/`)[2];
    if (!version || VERSIONS.indexOf(version) === -1) {
      version = VERSIONS[0];
    }
    this.version = version;

    const setVersion = version_ => {
      this.version = version_;
      if (version_ === 'latest') {
        Router.push('/versions/' + LATEST_VERSION + '/', '/versions/' + version_ + '/');
      } else {
        Router.push('/versions/' + version_ + '/', '/versions/' + version_ + '/');
      }
    };

    const canonicalUrl =
      'https://docs.expo.io' + Utilities.replaceVersionInUrl(this.props.url.pathname, 'latest');

    // TODO(jim): I ripped this out of the sidebar.
    let sidebarVersion = version;
    if (sidebarVersion === 'latest') {
      sidebarVersion = LATEST_VERSION;
    }

    let routes = _.find(NavigationJSON, { version: sidebarVersion.replace('.0.0', '') }).navigation;

    // TODO(jim): Cut this in another refactor. Should never have to do this. here.
    if (sidebarVersion === 'latest') {
      routes = _.cloneDeep(routes);
      mutateRouteDataForRender(routes);
    }

    const headerElement = (
      <DocumentationHeader
        user={this.props.user}
        pathname={this.props.url.pathname}
        activeVersion={this.version}
        setVersion={setVersion}
      />
    );

    const sidebarElement = (
      <DocumentationSidebar
        url={this.props.url}
        asPath={this.props.asPath}
        routes={routes}
        activeVersion={this.version}
      />
    );

    return (
      <DocumentationPageLayout header={headerElement} sidebar={sidebarElement}>
        <Head title={`${this.props.title} - Expo Documentation`}>
          {version === 'unversioned' && <meta name="robots" content="noindex" />}
          {version !== 'unversioned' && <link rel="canonical" href={canonicalUrl} />}
        </Head>

        <div className={STYLES_DOCUMENT}>
          <H1>{this.props.title}</H1>
          {this.props.children}
          <DocumentationFooter />
        </div>
      </DocumentationPageLayout>
    );
  }
}
