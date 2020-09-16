import * as React from 'react';
import { css } from 'react-emotion';

import { BASE_HEADING_LEVEL } from '../common/headingManager';
import DocumentationSidebarRightLink from './DocumentationSidebarRightLink';

import * as Constants from '~/common/constants';
import { paragraph } from '~/components/base/typography';
import ChevronDown from '~/components/icons/ChevronDown';
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

const STYLES_SIDEBAR_INDENT = css`
  padding-left: 16px;
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

class DocumentationSidebarRight extends React.Component {
  static defaultProps = {
    maxNestingDepth: 4,
  };

  state = {
    hidden: false,
    activeSlug: null,
  };

  activeItemRef = React.createRef();

  /**
   * Scrolls sidebar to keep active element always visible
   */
  _updateSelfScroll = () => {
    const selfScroll = this.props.selfRef?.current?.getScrollRef().current;
    const activeItemPos = this.activeItemRef.current?.offsetTop;

    if (!selfScroll || !activeItemPos) {
      return;
    }

    const { scrollTop } = selfScroll;
    const upperThreshold = window.innerHeight * UPPER_SCROLL_LIMIT_FACTOR;
    const lowerThreshold = window.innerHeight * LOWER_SCROLL_LIMIT_FACTOR;

    if (activeItemPos < scrollTop + upperThreshold) {
      selfScroll.scrollTo(0, Math.max(0, activeItemPos - upperThreshold));
    } else if (activeItemPos > scrollTop + lowerThreshold) {
      selfScroll.scrollTo(0, activeItemPos - lowerThreshold);
    }
  };

  handleContentScroll(contentScrollPosition) {
    const { headings } = this.props.headingManager;

    for (const { ref, slug } of headings) {
      if (!ref || !ref.current) {
        continue;
      }
      if (ref.current.offsetTop >= contentScrollPosition) {
        if (slug !== this.state.activeSlug) {
          this.setState({ activeSlug: slug }, this._updateSelfScroll);
        }
        return;
      }
    }
  }

  _show = () => {
    this.setState({ hidden: false });
  };
  _hide = () => {
    this.setState({ hidden: true });
  };

  render() {
    if (this.state.hidden) {
      return (
        <div className={STYLES_ICON_SHOW_CONTAINER} onClick={this._show}>
          <ChevronDown size={18} className={STYLES_ICON_SHOW} />
        </div>
      );
    }

    const customDataAttributes = {
      'data-sidebar': true,
    };

    const { headings } = this.props.headingManager;

    //filter out headings nested too much
    const displayedHeadings = headings.filter(
      head => head.level <= BASE_HEADING_LEVEL + this.props.maxNestingDepth
    );

    return (
      <nav className={STYLES_SIDEBAR} {...customDataAttributes}>
        <span className={STYLES_TITLE} onClick={this._hide}>
          <ChevronDown size={16} className={STYLES_ICON_HIDE} />
          {this.props.title}
        </span>

        <div className={STYLES_SIDEBAR_INDENT}>
          {displayedHeadings.map(heading => (
            <DocumentationSidebarRightLink
              key={heading.slug}
              heading={heading}
              isActive={heading.slug === this.state.activeSlug}
              ref={heading.slug === this.state.activeSlug ? this.activeItemRef : undefined}
              shortenCode
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

const SidebarForwardRef = React.forwardRef((props, ref) => (
  <SidebarWithHeadingManager {...props} reactRef={ref} />
));

export default SidebarForwardRef;
