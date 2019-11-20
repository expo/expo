import styled, { keyframes, css } from 'react-emotion';

import * as React from 'react';
import * as Utilities from '~/common/utilities';
import * as Constants from '~/common/constants';

import DocumentationSidebarLink from '~/components/DocumentationSidebarLink';
import DocumentationSidebarTitle from '~/components/DocumentationSidebarTitle';
import DocumentationSidebarGroup from '~/components/DocumentationSidebarGroup';

const STYLES_SIDEBAR = css`
  padding: 20px 24px 24px 24px;
  width: 280px;

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    width: 100%;
  }
`;

const STYLES_SECTION_CATEGORY = css`
  margin-bottom: 32px;
`;

export default class DocumentationSidebar extends React.Component {
  static defaultProps = {
    routes: [],
  };

  _renderPostElements = (info, category) => {
    return (
      <DocumentationSidebarLink
        key={`${category}-${info.name}`}
        info={info}
        url={this.props.url}
        asPath={this.props.asPath}>
        {info.sidebarTitle || info.name}
      </DocumentationSidebarLink>
    );
  };

  _renderCategoryElements = info => {
    if (info.children) {
      return (
        <DocumentationSidebarGroup
          key={`group-${info.name}`}
          url={this.props.url}
          info={info}
          asPath={this.props.asPath}>
          {info.children.map(categoryInfo => this._renderCategoryElements(categoryInfo))}
        </DocumentationSidebarGroup>
      );
    }

    const titleElement = (
      <DocumentationSidebarTitle
        key={info.sidebarTitle ? info.sidebarTitle : info.name}
        info={info}
        url={this.props.url}
        asPath={this.props.asPath}>
        {info.sidebarTitle ? info.sidebarTitle : info.name}
      </DocumentationSidebarTitle>
    );

    let postElements;
    if (info.posts) {
      postElements = info.posts.map(postInfo => this._renderPostElements(postInfo, info.name));
    }

    return (
      <div className={STYLES_SECTION_CATEGORY} key={`category-${info.name}`}>
        {titleElement}
        {postElements}
      </div>
    );
  };

  render() {
    const customDataAttributes = {
      'data-sidebar': true,
    };

    return (
      <nav className={STYLES_SIDEBAR} {...customDataAttributes}>
        {this.props.routes.map(categoryInfo => this._renderCategoryElements(categoryInfo))}
      </nav>
    );
  }
}
