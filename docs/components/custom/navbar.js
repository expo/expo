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
    if (linkUrl === this.props.url.pathname || linkUrl === this.props.asPath) {
      return true;
    }

    return false;
  }

  render() {
    const { info } = this.props;
    return (
      <Link prefetch href={info.href} as={info.as || info.href}>
        <a>{info.name}</a>
      </Link>
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

    return <NavLink info={info} url={this.props.url} asPath={this.props.asPath} />;
  }

  renderCategory(info, level = 1) {
    return (
      <div>
        {info.href ? (
          <NavLink info={info} url={this.props.url} asPath={this.props.asPath} />
        ) : (
          info.name
        )}
        {info.posts && <div>{info.posts.map(postInfo => this.renderPost(postInfo, level))}</div>}
      </div>
    );
  }

  updateLinks(data) {
    data.forEach(element => {
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

    return <nav>{routes.map(categoryInfo => this.renderCategory(categoryInfo))}</nav>;
  }
}
