import Link from 'next/link';
import Router from 'next/router';
import qs from 'query-string';
import _ from 'lodash';

import * as React from 'react';
import * as Utilities from '~/common/utilities';
import * as Constants from '~/common/constants';
import { LATEST_VERSION } from '~/common/versions';

import navigation from '~/navigation-data.json';

import Button from '~/components/base/button';
import AlgoliaSearch from '~/components/plugins/algolia-search';
import VersionSelector from '~/components/custom/version-selector';

export class NavLink extends React.Component {
  isSelected() {
    const linkUrl = this.props.info.as || this.props.info.href;
    if (linkUrl === this.props.url.pathname || linkUrl === this.props.asPath) return true;
    return false;
  }

  render() {
    const { info } = this.props;
    return (
      <div>
        <Link prefetch href={info.href} as={info.as || info.href}>
          <a className={this.isSelected() ? 'selected' : ''}>{info.name}</a>
        </Link>
        <style jsx>{`
          a {
            text-decoration: none;
            font-size: 16px;
            line-height: 1.5em;
            color: #333;
          }

          a:hover {
            color: ${Constants.colors.expo};
            padding-bottom: 2px;
            border-bottom: 1px solid ${Constants.colors.expo};
          }

          a.selected {
            color: ${Constants.colors.expo};
          }
        `}</style>
      </div>
    );
  }
}

export default class Navbar extends React.Component {
  componentDidMount() {
    Router.onRouteChangeStart = () => {
      // Maintain navbar scroll position when navigating
      window._expoSidebarScrollPosition = this.props.getSidebarScrollPosition();
      window.NProgress.start();
    };

    Router.onRouteChangeComplete = () => {
      this.props.setSidebarScrollPosition(window._expoSidebarScrollPosition);
      window.NProgress.done();
    };

    Router.onRouteChangeError = () => {
      window.NProgress.done();
    };
  }

  renderPost(info, level) {
    if (info.posts) {
      return this.renderCategory(info, level + 1);
    }

    return (
      <div className="link" key={info.href}>
        <NavLink info={info} url={this.props.url} asPath={this.props.asPath} />
        <style jsx>{`
          .link {
            margin: 8px 0;
          }

          @media screen and (max-width: ${Constants.breakpoints.mobile}) {
            .link {
              padding: 5px 0;
              margin: 0;
              border-bottom: 0px;
              font-size: 20px;
            }
          }
        `}</style>
      </div>
    );
  }

  renderCategory(info, level = 1) {
    const levelClass = `level-${level}`;
    const postStyle = {
      marginLeft: 10 * (level - 1),
    };

    return (
      <div className={`category ${levelClass}`} key={info.name}>
        <div className="label">
          {info.href ? (
            <NavLink info={info} url={this.props.url} asPath={this.props.asPath} />
          ) : (
            info.name
          )}
        </div>
        {info.posts && (
          <div className="posts" style={postStyle}>
            {info.posts.map(postInfo => this.renderPost(postInfo, level))}
          </div>
        )}
        <style jsx>{`
          .label {
            margin: 0 0 15px 0;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1.3px;
            font-weight: 400;
            color: #888;
            cursor: default;
          }

          .level-2 .label {
            font-size: 14px;
            font-weight: 400;
            margin: 10px 0;
            text-transform: none;
            letter-spacing: 0;
            cursor: default;
          }

          .category.level-1 {
            margin: 0px 0 48px 0;
          }

          .category.level-1:last-child {
            margin: 0px 0 20px 0;
          }

          @media screen and (max-width: ${Constants.breakpoints.mobile}) {
            .label {
              margin: 10px 0;
              font-size: 16px;
            }

            .level-2 .label {
              padding: 0px 0;
              margin: 0;
              border-bottom: 0px;
              font-size: 16px;
            }
          }
        `}</style>
      </div>
    );
  }

  updateLinks(data) {
    data.forEach(element => {
      // href is the underlying page (so if latest, it's the page referring to the latest version, v22)
      // as is the URL display in the browser (latest)
      if (element.href) {
        element.as = Utilities.replaceVersionInUrl(element.href, 'latest');
      }
      if (element.posts) {
        this.updateLinks(element.posts);
      }
    });
  }

  render() {
    let version = this.props.activeVersion;
    if (version === 'latest') {
      version = LATEST_VERSION;
    }

    let routes = _.find(navigation, { version: version.replace('.0.0', '') }).navigation;

    if (this.props.activeVersion === 'latest') {
      routes = _.cloneDeep(routes);
      this.updateLinks(routes);
    }

    return (
      <div>
        <div className="navbar">
          {this.props.mobile && (
            <div
              style={{
                paddingTop: '20px',
                paddingBottom: '15px',
                paddingRight: '20px',
                paddingLeft: '20px',
                borderBottom: '1px solid #ccc',
                marginBottom: '1.45rem',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <VersionSelector
                  activeVersion={this.props.activeVersion}
                  setVersion={this.props.setVersion}
                />
                <Button onClick={this.props.toggleMobileOverlay} value="Close" />
              </div>
              <div style={{ display: 'flex', width: '100%', marginTop: '5px' }}>
                <AlgoliaSearch
                  style={{ width: '100%' }}
                  router={this.props.router}
                  activeVersion={this.props.activeVersion}
                />
              </div>
            </div>
          )}
          <div style={{ padding: '0px 20px 0px 20px' }}>
            {routes.map(categoryInfo => this.renderCategory(categoryInfo))}
          </div>
        </div>

        <style jsx>{`
          @media screen and (max-width: ${Constants.breakpoints.mobile}) {
            .navbar {
              background: white;
              position: absolute;
              padding: 0px;
              width: 100%;
              height: calc(100% + 200px);
              top: -200px;
              padding-top: 200px;
              z-index: 10000;
              overflow-y: scroll;
              -webkit-overflow-scrolling: touch;
              display: block;
            }
          }
        `}</style>
      </div>
    );
  }
}
