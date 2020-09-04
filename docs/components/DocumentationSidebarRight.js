import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/common/constants';
import DocumentationSidebarGroup from '~/components/DocumentationSidebarGroup';
import DocumentationSidebarLink from '~/components/DocumentationSidebarLink';
import DocumentationSidebarTitle from '~/components/DocumentationSidebarTitle';
import withHeadingManager from '~/components/page-higher-order/withHeadingManager';

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

const STYLES_TITLE = css`
  color: ${Constants.colors.expoLighter};
  display: block;
  position: relative;
  margin-bottom: 16px;
  line-height: 1.5rem;
  text-decoration: none;
  font-family: ${Constants.fontFamilies.demi};
  user-select: none;
`;

const STYLES_SIDEBAR_INDENT = css`
  display: block;
  border-left-width: 1px;
  border-left-color: #ccc;
  border-left-style: dashed;
  padding-left: 12px;
`;

const STYLES_LINK = css`
  display: block;
  margin-bottom: 5px;
  line-height: 1.3rem;
  text-decoration: none;
`;

const STYLES_LINK_NESTED = css`
  display: block;
  font-size: 15px;
  margin-bottom: 2px;
  line-height: 1.3rem;
  text-decoration: none;
`;

const STYLES_LINK_ACTIVE = css`
  font-family: ${Constants.fontFamilies.demi};
  color: ${Constants.colors.expoLighter};

  :visited {
    color: ${Constants.colors.expo};
  }

  :hover {
    color: ${Constants.colors.expo};
  }
`;

const STYLES_LINK_DEFAULT = css`
  font-family: ${Constants.fontFamilies.book};
  color: ${Constants.colors.black80};
  transition: 200ms ease color;

  :visited {
    color: ${Constants.colors.black60};
  }

  :hover {
    color: ${Constants.colors.expo};
  }
`;

const NESTING_OFFSET = 12;

const removeDot = str => {
  const dotIdx = str.indexOf('.');
  if (dotIdx > 0) str = str.substring(dotIdx + 1);

  const parIdx = str.indexOf('(');
  if (parIdx > 0) str = str.substring(0, parIdx + 1) + ')';

  return str;
};

function Item({ heading, activeSlug, shortForm }) {
  const { slug, level, title, type } = heading;
  const isActive = activeSlug != null && slug === activeSlug;

  const isCode = type === 'inlineCode';
  const displayTitle = shortForm && isCode ? removeDot(title) : title;
  const paddingLeft = NESTING_OFFSET * (level - 2) + 'px';
  const linkBaseStyle = level < 3 ? STYLES_LINK : STYLES_LINK_NESTED;
  const linkFont = isCode ? Constants.fontFamilies.mono : undefined;
  const fontSize = isCode ? 14 : undefined;
  const textDecoration = isCode && isActive ? 'underline' : undefined;

  return (
    <div>
      <a
        style={{ paddingLeft, fontFamily: linkFont, fontSize, textDecoration }}
        href={'#' + slug}
        className={`${linkBaseStyle} ${isActive ? STYLES_LINK_ACTIVE : STYLES_LINK_DEFAULT}`}>
        {displayTitle}
      </a>
    </div>
  );
}

class DocumentationSidebarRight extends React.Component {
  static defaultProps = {
    routes: [],
  };

  state = {
    activeSlug: null,
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

  handleContentScroll(contentScrollPosition) {
    const { headingManager } = this.props;
    const { headings } = headingManager;

    for (const heading of headings) {
      if (!heading.ref) {
        continue;
      }
      const { current } = heading.ref;
      if (current && current.offsetTop >= contentScrollPosition) {
        if (heading.slug !== this.state.activeSlug) {
          this.setState({ activeSlug: heading.slug });
        }
        break;
      }
    }
  }

  render() {
    const customDataAttributes = {
      'data-sidebar': true,
    };

    const { headings } = this.props.headingManager;

    return (
      <nav className={STYLES_SIDEBAR} {...customDataAttributes}>
        <span className={STYLES_TITLE}>{this.props.title}</span>

        <div className={STYLES_SIDEBAR_INDENT}>
          {headings.map(heading => (
            <Item
              key={heading.slug}
              heading={heading}
              activeSlug={this.state.activeSlug}
              shortForm
            />
          ))}
        </div>
      </nav>
    );
  }
}
const SidebarWithHeadingManager = withHeadingManager(function SidebarWithHeadingManager({
  reactRef,
  ...props
}) {
  return <DocumentationSidebarRight {...props} ref={reactRef} />;
});

SidebarWithHeadingManager.displayName = 'SidebarRightRefWrapper';

export default React.forwardRef((props, ref) => (
  <SidebarWithHeadingManager {...props} reactRef={ref} />
));
