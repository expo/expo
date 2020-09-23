import * as React from 'react';
import { css } from '@emotion/core';

import { paragraph } from '~/components/base/typography';
import withHeadingManager from '~/components/page-higher-order/withHeadingManager';
import * as Constants from '~/constants/theme';
import { BASE_HEADING_LEVEL } from '~/common/headingManager';
import DocumentationSidebarRightLink from './DocumentationSidebarRightLink';

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
  justify-content: flex-start;
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

const STYLES_ICON_SHOW_CONTAINER = css`
  top: 83px;
  right: 15px;
  position: fixed;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  user-select: none;
  background: ${Constants.expoColors.gray[200]};
  padding: 8px 16px;
  border-radius: 4px;
  color: ${Constants.expoColors.black};

  :hover {
    cursor: pointer;
  }
`;

const STYLES_ICON_SHOW = css`
  transform: rotate(90deg);
`;

const STYLES_ICON_HIDE = css`
  min-width: 16px;
  padding-bottom: 5px;
  transform: rotate(270deg);
`;

const UPPER_SCROLL_LIMIT_FACTOR = 1 / 4;
const LOWER_SCROLL_LIMIT_FACTOR = 3 / 4;

const ACTIVE_ITEM_OFFSET_FACTOR = 1 / 6;

const isDynamicScrollAvailable = () => {
  if (!history?.replaceState) {
    return false;
  }

  if (window.matchMedia('(prefers-reduced-motion)').matches) {
    return false;
  }

  return true;
};

class DocumentationSidebarRight extends React.Component {
  static defaultProps = {
    maxNestingDepth: 4,
  };

  state = {
    activeSlug: null,
  };

  slugScrollingTo = null;

  activeItemRef = React.createRef();

  /**
   * Scrolls sidebar to keep active element always visible
   */
  _updateSelfScroll = () => {
    const selfScroll = this.props.selfRef?.current?.getScrollRef().current;
    const activeItemPos = this.activeItemRef.current?.offsetTop;

    if (!selfScroll || !activeItemPos || this.slugScrollingTo) {
      return;
    }

    const { scrollTop } = selfScroll;
    const upperThreshold = window.innerHeight * UPPER_SCROLL_LIMIT_FACTOR;
    const lowerThreshold = window.innerHeight * LOWER_SCROLL_LIMIT_FACTOR;

    if (activeItemPos < scrollTop + upperThreshold) {
      selfScroll.scrollTo({ behavior: 'auto', top: Math.max(0, activeItemPos - upperThreshold) });
    } else if (activeItemPos > scrollTop + lowerThreshold) {
      selfScroll.scrollTo({ behavior: 'auto', top: activeItemPos - lowerThreshold });
    }
  };

  handleContentScroll(contentScrollPosition) {
    const { headings } = this.props.headingManager;

    for (const { ref, slug } of headings) {
      if (!ref || !ref.current) {
        continue;
      }
      if (
        ref.current.offsetTop >=
          contentScrollPosition + window.innerHeight * ACTIVE_ITEM_OFFSET_FACTOR &&
        ref.current.offsetTop <= contentScrollPosition + window.innerHeight / 2
      ) {
        if (slug !== this.state.activeSlug) {
          // we can enable scrolling again
          if (slug === this.slugScrollingTo) {
            this.slugScrollingTo = null;
          }
          this.setState({ activeSlug: slug }, this._updateSelfScroll);
        }
        return;
      }
    }
  }

  _handleLinkClick = (event, heading) => {
    if (!isDynamicScrollAvailable()) {
      return;
    }

    event.preventDefault();
    const { title, slug, ref } = heading;

    // disable sidebar scrolling until we reach that slug
    this.slugScrollingTo = slug;

    this.props.contentRef.current?.getScrollRef().current?.scrollTo({
      behavior: 'smooth',
      top: ref.current?.offsetTop - window.innerHeight * ACTIVE_ITEM_OFFSET_FACTOR,
    });
    history.replaceState(history.state, title, '#' + slug);
  };

  render() {
    const { headings } = this.props.headingManager;

    //filter out headings nested too much
    const displayedHeadings = headings.filter(
      head => head.level <= BASE_HEADING_LEVEL + this.props.maxNestingDepth
    );

    return (
      <nav css={STYLES_SIDEBAR} data-sidebar>
        {displayedHeadings.map(heading => {
          const isActive = heading.slug === this.state.activeSlug;
          return (
            <DocumentationSidebarRightLink
              key={heading.slug}
              heading={heading}
              onClick={e => this._handleLinkClick(e, heading)}
              isActive={isActive}
              ref={isActive ? this.activeItemRef : undefined}
              shortenCode
            />
          );
        })}
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

const SidebarForwardRef = React.forwardRef((props, ref) => (
  <SidebarWithHeadingManager {...props} reactRef={ref} />
));

export default SidebarForwardRef;
