import Router from 'next/router';
import * as React from 'react';
import { css } from 'react-emotion';
import some from 'lodash/some';

import * as Constants from '~/common/constants';
import navigation from '~/common/navigation';
import * as Utilities from '~/common/utilities';
import { VERSIONS } from '~/common/versions';
import * as WindowUtils from '~/common/window';
import DocumentationFooter from '~/components/DocumentationFooter';
import DocumentationHeader from '~/components/DocumentationHeader';
import DocumentationNestedScrollLayout from '~/components/DocumentationNestedScrollLayout';
import DocumentationPageContext from '~/components/DocumentationPageContext';
import DocumentationSidebar from '~/components/DocumentationSidebar';
import Head from '~/components/Head';
import { H1 } from '~/components/base/headings';

const STYLES_DOCUMENT = css`
  padding: 24px 24px 24px 32px;

  hr {
    border-top: 1px solid ${Constants.colors.border};
    border-bottom: 0px;
  }

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    padding: 32px 16px 48px 16px;
  }
`;

export default class DocumentationPage extends React.Component {
  state = {
    isMenuActive: false,
  };

  componentDidMount() {
    Router.onRouteChangeStart = () => {
      if (this.refs.layout) {
        window.__sidebarScroll = this.refs.layout.getSidebarScrollTop();
      }
      window.NProgress.start();
    };

    Router.onRouteChangeComplete = () => {
      window.NProgress.done();
    };

    Router.onRouteChangeError = () => {
      window.NProgress.done();
    };

    window.addEventListener('resize', this._handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._handleResize);
  }

  _handleResize = () => {
    if (WindowUtils.getViewportSize().width >= Constants.breakpoints.mobileValue) {
      window.scrollTo(0, 0);
    }
  };

  _handleSetVersion = version => {
    this._version = version;
    let newPath = '/versions/' + version;

    // TODO: Find what's stripping trailing slashes from these
    if (version.startsWith('v')) {
      newPath += '/';
    }

    Router.push(newPath + '/');
  };

  _handleShowMenu = () => {
    this.setState({
      isMenuActive: true,
    });
  };

  _handleHideMenu = () => {
    this.setState({
      isMenuActive: false,
    });
  };

  _isReferencePath = () => {
    return this.props.url.pathname.startsWith('/versions');
  };

  _isGeneralPath = () => {
    return !this._isReferencePath() && !this._isGettingStartedPath();
  };

  _isGettingStartedPath = () => {
    return (
      this.props.url.pathname === '/' ||
      some(navigation.startingDirectories, name => this.props.url.pathname.startsWith(`/${name}`))
    );
  };

  _getCanonicalUrl = () => {
    if (this._isReferencePath()) {
      return `https://docs.expo.io${Utilities.replaceVersionInUrl(
        this.props.url.pathname,
        'latest'
      )}`;
    } else {
      return `https://docs.expo.io/${this.props.url.pathname}`;
    }
  };

  _getVersion = () => {
    let version = (this.props.asPath || this.props.url.pathname).split(`/`)[2];
    if (!version || VERSIONS.indexOf(version) === -1) {
      version = VERSIONS[0];
    }
    if (!version) {
      version = 'latest';
    }

    this._version = version;
    return version;
  };

  _getRoutes = () => {
    if (this._isReferencePath()) {
      const version = this._getVersion();
      return navigation.reference[version];
    } else if (this._isGeneralPath()) {
      return navigation.general;
    } else if (this._isGettingStartedPath()) {
      return navigation.starting;
    }
  };

  _getActiveTopLevelSection = () => {
    if (this._isReferencePath()) {
      return 'reference';
    } else if (this._isGeneralPath()) {
      return 'general';
    } else if (this._isGettingStartedPath()) {
      return 'starting';
    }
  };

  render() {
    const sidebarScrollPosition = process.browser ? window.__sidebarScroll : 0;
    const version = this._getVersion();
    const routes = this._getRoutes();

    const headerElement = (
      <DocumentationHeader
        activeSection={this._getActiveTopLevelSection()}
        pathname={this.props.url.pathname}
        version={this._version}
        isMenuActive={this.state.isMenuActive}
        isAlogiaSearchHidden={this.state.isMenuActive}
        onSetVersion={this._handleSetVersion}
        onShowMenu={this._handleShowMenu}
        onHideMenu={this._handleHideMenu}
      />
    );

    const sidebarElement = (
      <DocumentationSidebar
        url={this.props.url}
        asPath={this.props.asPath}
        routes={routes}
        version={this._version}
        onSetVersion={this._handleSetVersion}
        isVersionSelectorHidden={!this._isReferencePath()}
      />
    );

    return (
      <DocumentationNestedScrollLayout
        ref="layout"
        header={headerElement}
        sidebar={sidebarElement}
        isMenuActive={this.state.isMenuActive}
        sidebarScrollPosition={sidebarScrollPosition}>
        <Head title={`${this.props.title} - Expo Documentation`}>
          {this._version === 'unversioned' && <meta name="robots" content="noindex" />}
          {this._version !== 'unversioned' && (
            <link rel="canonical" href={this._getCanonicalUrl()} />
          )}
        </Head>

        {!this.state.isMenuActive ? (
          <div className={STYLES_DOCUMENT}>
            <H1>{this.props.title}</H1>
            <DocumentationPageContext.Provider value={{ version: this._version }}>
              {this.props.children}
            </DocumentationPageContext.Provider>
            <DocumentationFooter
              title={this.props.title}
              asPath={this.props.asPath}
              sourceCodeUrl={this.props.sourceCodeUrl}
            />
          </div>
        ) : (
          <DocumentationSidebar
            url={this.props.url}
            asPath={this.props.asPath}
            routes={routes}
            isVersionSelectorHidden={!this._isReferencePath()}
          />
        )}
      </DocumentationNestedScrollLayout>
    );
  }
}
