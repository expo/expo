import Router from 'next/router';

import * as React from 'react';
import * as Utilities from '~/common/utilities';
import { VERSIONS, LATEST_VERSION } from '~/common/versions';

import { H1, H2, H3, H4 } from '~/components/base/headers';
import Head from '~/components/base/head';
import Page from '~/components/base/page';
import Header from '~/components/custom/header';
import Navbar from '~/components/custom/navbar';
import Footer from '~/components/custom/footer';
import FreezePageScroll from '~/components/custom/freeze-page-scroll';

export default class DocumentationPage extends React.Component {
  state = {
    isMobileOverlayVisible: false,
  };

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

    return (
      <Page>
        <Head title={`${this.props.title} - Expo Documentation`}>
          {version === 'unversioned' && <meta name="robots" content="noindex" />}
          {version !== 'unversioned' && <link rel="canonical" href={canonicalUrl} />}
        </Head>
        <div
          className="header"
          style={{
            display: this.state.isMobileOverlayVisible ? 'none' : 'block',
          }}>
          <Header
            inverse
            user={this.props.user}
            pathname={this.props.url.pathname}
            onLogout={() => {
              this.props.onUser(null);
              this.props.url.push('/login');
            }}
            onLogoRightClick={() => this.props.url.push('/logos')}
            activeVersion={this.version}
            setVersion={setVersion}
            toggleMobileOverlay={() =>
              this.setState({
                isMobileOverlayVisible: !this.state.isMobileOverlayVisible,
              })
            }
          />
        </div>

        {this.state.isMobileOverlayVisible && (
          <Navbar
            mobile
            className="mobile-overlay"
            url={this.props.url}
            asPath={this.props.asPath}
            activeVersion={this.version}
            toggleMobileOverlay={() =>
              this.setState({
                isMobileOverlayVisible: !this.state.isMobileOverlayVisible,
              })
            }
            setVersion={setVersion}
            getSidebarScrollPosition={() => this.sidebar.scrollTop}
            setSidebarScrollPosition={val => (this.sidebar.scrollTop = val)}
          />
        )}
        {!this.state.isMobileOverlayVisible && (
          <div className="page-container">
            <FreezePageScroll>
              <div
                className="sidebar"
                style={{ background: 'white' }}
                ref={sidebar => {
                  this.sidebar = sidebar;
                }}>
                <Navbar
                  url={this.props.url}
                  asPath={this.props.asPath}
                  activeVersion={this.version}
                  getSidebarScrollPosition={() => this.sidebar.scrollTop}
                  setSidebarScrollPosition={val => (this.sidebar.scrollTop = val)}
                />
              </div>
            </FreezePageScroll>
            <div className="doc-layout">
              <div className="content" id="content">
                <H1>{this.props.title}</H1>
                <div className="doc-markdown">
                  {this.props.children}
                  <Footer url={this.props.url} />
                </div>
              </div>
            </div>
          </div>
        )}
      </Page>
    );
  }
}
