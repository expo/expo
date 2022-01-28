import { css } from '@emotion/react';
import { NextRouter } from 'next/router';
import * as React from 'react';

import DocumentationSidebarGroup from '~/components/DocumentationSidebarGroup';
import DocumentationSidebarLink from '~/components/DocumentationSidebarLink';
import DocumentationSidebarTitle from '~/components/DocumentationSidebarTitle';
import VersionSelector from '~/components/VersionSelector';
import * as Constants from '~/constants/theme';
import { NavigationRoute } from '~/types/common';

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

function shouldSkipTitle(info: NavigationRoute, parentGroup?: NavigationRoute) {
  if (info.name === parentGroup?.name) {
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

type Props = {
  router: NextRouter;
  isVersionSelectorHidden: boolean;
  routes: NavigationRoute[];
  version: string;
  onSetVersion: (value: string) => void;
};

export default class DocumentationSidebar extends React.Component<Props> {
  static defaultProps = {
    routes: [],
  };

  private renderPostElements = (info: NavigationRoute, category: string) => {
    return (
      <DocumentationSidebarLink
        key={`${category}-${info.name}`}
        router={this.props.router}
        info={info}>
        {info.sidebarTitle || info.name}
      </DocumentationSidebarLink>
    );
  };

  private renderCategoryElements = (info: NavigationRoute, parentGroup?: NavigationRoute) => {
    if (info.hidden) {
      return null;
    }

    if (info.children) {
      return (
        <DocumentationSidebarGroup
          key={`group-${info.name}`}
          router={this.props.router}
          info={info}>
          {info.children.map(categoryInfo => this.renderCategoryElements(categoryInfo, info))}
        </DocumentationSidebarGroup>
      );
    }

    const titleElement = shouldSkipTitle(info, parentGroup) ? null : (
      <DocumentationSidebarTitle key={info.sidebarTitle || info.name}>
        {info.sidebarTitle || info.name}
      </DocumentationSidebarTitle>
    );

    let postElements;
    if (info.posts) {
      postElements = info.posts.map(postInfo => this.renderPostElements(postInfo, info.name));
    }

    return (
      <div css={STYLES_SECTION_CATEGORY} key={`category-${info.name}`}>
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
      <nav css={STYLES_SIDEBAR} {...customDataAttributes}>
        {!this.props.isVersionSelectorHidden && (
          <VersionSelector version={this.props.version} onSetVersion={this.props.onSetVersion} />
        )}

        {this.props.routes.map(categoryInfo => {
          if (categoryInfo.hidden) {
            return null;
          }
          return this.renderCategoryElements(categoryInfo);
        })}
      </nav>
    );
  }
}
