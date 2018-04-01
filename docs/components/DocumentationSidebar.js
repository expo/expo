import styled, { keyframes, css } from 'react-emotion';

import Router from 'next/router';
import qs from 'query-string';
import _ from 'lodash';

import * as React from 'react';
import * as Utilities from '~/common/utilities';
import * as Constants from '~/common/constants';

import DocumentationSidebarLink from '~/components/DocumentationSidebarLink';
import DocumentationSidebarTitle from '~/components/DocumentationSidebarTitle';
import Button from '~/components/base/button';
import AlgoliaSearch from '~/components/plugins/algolia-search';
import VersionSelector from '~/components/custom/version-selector';

const STYLES_SIDEBAR = css`
  width: 100%;
  padding: 34px 24px 24px 24px;
  max-width: 280px;
`;

const STYLES_SECTION_CATEGORY = css`
  margin-bottom: 32px;
`;

export default class DocumentationSidebar extends React.Component {
  static defaultProps = {
    routes: [],
  };

  _renderPostElements = info => {
    return (
      <DocumentationSidebarLink
        key={`${this.props.url}-${info.name}`}
        info={info}
        url={this.props.url}
        asPath={this.props.asPath}>
        {info.name}
      </DocumentationSidebarLink>
    );
  };

  _renderCategoryElements = info => {
    const titleElement = (
      <DocumentationSidebarTitle
        key={`${this.props.url}-${info.name}`}
        info={info}
        url={this.props.url}
        asPath={this.props.asPath}>
        {info.name}
      </DocumentationSidebarTitle>
    );

    let postElements;
    if (info.posts) {
      postElements = info.posts.map(postInfo => this._renderPostElements(postInfo));
    }

    return (
      <div className={STYLES_SECTION_CATEGORY} key={`category-${info.name}`}>
        {titleElement}
        {postElements}
      </div>
    );
  };

  render() {
    return (
      <nav className={STYLES_SIDEBAR}>
        {this.props.routes.map(categoryInfo => this._renderCategoryElements(categoryInfo))}
      </nav>
    );
  }
}
