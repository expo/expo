import * as React from 'react';
import { css } from 'react-emotion';

import { BASE_HEADING_LEVEL } from '../common/headingManager';
import DocumentationSidebarRightLink from './DocumentationSidebarRightLink';

import * as Constants from '~/common/constants';
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

class DocumentationSidebarRight extends React.Component {
  static defaultProps = {
    maxNestingDepth: 4,
  };

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

    //filter out headings nested too much
    const displayedHeadings = headings.filter(
      head => head.level <= BASE_HEADING_LEVEL + this.props.maxNestingDepth
    );

    return (
      <nav className={STYLES_SIDEBAR} {...customDataAttributes}>
        <span className={STYLES_TITLE}>{this.props.title}</span>

        <div className={STYLES_SIDEBAR_INDENT}>
          {displayedHeadings.map(heading => (
            <DocumentationSidebarRightLink
              key={heading.slug}
              heading={heading}
              isActive={heading.slug === this.state.activeSlug}
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
