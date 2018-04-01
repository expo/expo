import Router from 'next/router';
import styled, { keyframes, css } from 'react-emotion';

import * as React from 'react';
import * as Utilities from '~/common/utilities';
import { VERSIONS, LATEST_VERSION } from '~/common/versions';

import { H1, H2, H3, H4 } from '~/components/base/headings';
import Head from '~/components/base/head';
import Header from '~/components/custom/header';
import Footer from '~/components/custom/footer';

import DocumentationPageLayout from '~/components/DocumentationPageLayout';
import DocumentationSidebar from '~/components/DocumentationSidebar';

const STYLES_DOCUMENT = css`
  padding: 24px;
`;

export default class DocumentationPage extends React.Component {
  render() {
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

    const headerElement = (
      <Header
        user={this.props.user}
        pathname={this.props.url.pathname}
        onLogout={() => {
          this.props.onUser(null);
          this.props.url.push('/login');
        }}
        onLogoRightClick={() => this.props.url.push('/logos')}
        activeVersion={this.version}
        setVersion={setVersion}
      />
    );

    const sidebarElement = (
      <DocumentationSidebar
        url={this.props.url}
        asPath={this.props.asPath}
        activeVersion={this.version}
        getSidebarScrollPosition={() => this.sidebar.scrollTop}
        setSidebarScrollPosition={val => (this.sidebar.scrollTop = val)}
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
          <Footer url={this.props.url} />
        </div>
      </DocumentationPageLayout>
    );
  }
}
