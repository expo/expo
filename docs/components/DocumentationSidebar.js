import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/constants/theme';
import DocumentationSidebarGroup from '~/components/DocumentationSidebarGroup';
import DocumentationSidebarLink from '~/components/DocumentationSidebarLink';
import DocumentationSidebarTitle from '~/components/DocumentationSidebarTitle';
import VersionSelector from '~/components/VersionSelector';

const STYLES_SIDEBAR = css`
  padding: 20px 24px 24px 24px;
  width: 280px;

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    width: 100%;
  }
`;

const STYLES_SECTION_CATEGORY = css`
  margin-bottom: 24px;
`;

function shouldSkipTitle(info, parentGroup) {
  if (parentGroup && info.name === parentGroup.name) {
    // If the title of the group is Expo SDK and the section within it has the same name
    // then we shouldn't show the title twice. You might want to organize your group like
    // so it is collapsable
    return true;
  } else if (
    info.posts &&
    ((info.posts[0] || {}).sidebarTitle || (info.posts[0] || {}).name) === info.name
  ) {
    // If the first child post in the group has the same name as the group, then hide the
    // group title, lest we be very repetititve
    return true;
  }

  return false;
}

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

  _renderCategoryElements = (info, parentGroup) => {
    if (info.children) {
      return (
        <DocumentationSidebarGroup
          key={`group-${info.name}`}
          url={this.props.url}
          info={info}
          asPath={this.props.asPath}>
          {info.children.map(categoryInfo => this._renderCategoryElements(categoryInfo, info))}
        </DocumentationSidebarGroup>
      );
    }

    const titleElement = shouldSkipTitle(info, parentGroup) ? null : (
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
        {!this.props.isVersionSelectorHidden && (
          <VersionSelector version={this.props.version} onSetVersion={this.props.onSetVersion} />
        )}

        {this.props.routes.map(categoryInfo => this._renderCategoryElements(categoryInfo))}
      </nav>
    );
  }
}
