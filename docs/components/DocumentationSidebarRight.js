import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/common/constants';
import { HeadingType } from '~/common/headingManager';
import { paragraph } from '~/components/base/typography';
import withHeadingManager from '~/components/page-higher-order/withHeadingManager';

const STYLES_SIDEBAR = css`
  padding: 20px 24px 24px 24px;
  width: 280px;

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    width: 100%;
  }
`;

const STYLES_TITLE = css`
  ${paragraph}
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  margin-bottom: 16px;
  text-decoration: none;
  font-family: ${Constants.fontFamilies.demi};
  user-select: none;
  background: ${Constants.expoColors.gray[200]};
  padding: 8px 16px;
  border-radius: 4px;
  color: ${Constants.expoColors.black};

  :hover {
    cursor: pointer;
  }
`;

const STYLES_SIDEBAR_INDENT = css`
  padding-left: 16px;
`;

const STYLES_LINK = css`
  display: block;
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

const STYLES_ACTIVE_CONTAINER = css`
  display: flex;
  margin-bottom: 6px;
  cursor: pointer;
`;

const STYLES_ACTIVE_BULLET = css`
  min-height: 6px;
  min-width: 6px;
  height: 6px;
  width: 6px;
  background-color: ${Constants.expoColors.primary[500]};
  border-radius: 4px;
  position: relative;
  left -12px;
  top: 7px;
`;

const STYLES_LINK_ACTIVE = css`
  ${paragraph}
  font-size: 15px;
  line-height: 140%;
  font-family: ${Constants.fontFamilies.demi};
  color: ${Constants.colors.expoLighter};
  position: relative;
  left -7px;

  :visited {
    color: ${Constants.expoColors.primary[500]};
  }

  :hover {
    color: ${Constants.expoColors.primary[500]};
  }
`;

const STYLES_LINK_DEFAULT = css`
  ${paragraph}
  color: ${Constants.colors.black80};
  line-height: 140%;
  transition: 200ms ease color;
  font-size: 15px;

  :visited {
    color: ${Constants.colors.black60};
  }

  :hover {
    color: ${Constants.expoColors.primary[500]};
  }
`;

const NESTING_BASE_LEVEL = 2;
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

  const isCode = type === HeadingType.Code;
  const displayTitle = shortForm && isCode ? removeDot(title) : title;
  const paddingLeft = NESTING_OFFSET * (level - NESTING_BASE_LEVEL) + 'px';
  const linkBaseStyle = level < 3 ? STYLES_LINK : STYLES_LINK_NESTED;
  const linkFont = isCode ? Constants.fontFamilies.mono : undefined;
  const fontSize = isCode ? 14 : undefined;

  return (
    <div className={STYLES_ACTIVE_CONTAINER}>
      {isActive && <div className={STYLES_ACTIVE_BULLET} />}
      <a
        style={{ paddingLeft, fontFamily: linkFont, fontSize }}
        href={'#' + slug}
        className={`${linkBaseStyle} ${isActive ? STYLES_LINK_ACTIVE : STYLES_LINK_DEFAULT}`}>
        {displayTitle}
      </a>
    </div>
  );
}

class DocumentationSidebarRight extends React.Component {
  state = {
    activeSlug: null,
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
