import * as React from 'react';
import { css } from 'react-emotion';

import { BASE_HEADING_LEVEL, HeadingType } from '../common/headingManager';

import { paragraph } from '~/components/base/typography';
import * as Constants from '~/constants/theme';

const STYLES_LINK = css`
  ${paragraph}
  color: ${Constants.expoColors.gray[600]};
  transition: 200ms ease color;
  font-size: 14px;
  display: block;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
  cursor: pointer;

  :hover {
    color: ${Constants.expoColors.primary[500]};
  }
`;

const STYLES_LINK_HEADER = css`
  font-family: ${Constants.fontFamilies.demi};
`;

const STYLES_LINK_CODE = css`
  font-family: ${Constants.fontFamilies.mono};
  font-size: 13px;
`;

const STYLES_LINK_ACTIVE = css`
  color: ${Constants.expoColors.primary[500]};
`;

const STYLES_TOOLTIP = css`
  border-radius: 3px;
  position: absolute;
  background-color: ${Constants.expoColors.white};
  font-family: ${Constants.fontFamilies.demi};
  max-width: 400px;
  border: 1px solid black;
  padding: 3px 6px;
  letter-spacing: normal;
  line-height: 1.4;
  word-break: break-word;
  word-wrap: normal;
  font-size: 12px;

  display: inline-block;
`;

const STYLES_CODE_TOOLTIP = css`
  font-family: ${Constants.fontFamilies.mono};
  font-size: 11px;
`;

const NESTING_OFFSET = 16;

/**
 * Replaces `Module.someFunction(arguments: argType)`
 * with `someFunction()`
 */
const trimCodedTitle = str => {
  const dotIdx = str.indexOf('.');
  if (dotIdx > 0) str = str.substring(dotIdx + 1);

  const parIdx = str.indexOf('(');
  if (parIdx > 0) str = str.substring(0, parIdx + 1) + ')';

  return str;
};

/**
 * Determines if element is overflowing
 * (its width exceeds container width)
 * @param {HTMLElement} el element to check
 */
const isOverflowing = el => {
  if (!el) {
    return false;
  }

  return el.clientWidth < el.scrollWidth;
};

const Tooltip = ({ children, isCode, topOffset }) => (
  <div
    className={`${STYLES_TOOLTIP} ${isCode && STYLES_CODE_TOOLTIP}`}
    style={{ right: 20, top: topOffset }}>
    {children}
  </div>
);

const DocumentationSidebarRightLink = React.forwardRef(
  ({ heading, isActive, shortenCode, onClick }, ref) => {
    const { slug, level, title, type } = heading;

    const isNested = level <= BASE_HEADING_LEVEL;
    const isCode = type === HeadingType.InlineCode;

    const paddingLeft = NESTING_OFFSET * (level - BASE_HEADING_LEVEL) + 'px';
    const displayTitle = shortenCode && isCode ? trimCodedTitle(title) : title;

    const [tooltipVisible, setTooltipVisible] = React.useState(false);
    const [tooltipOffset, setTooltipOffset] = React.useState(-20);
    const onMouseOver = event => {
      setTooltipVisible(isOverflowing(event.target));
      setTooltipOffset(event.target.getBoundingClientRect().top + 25);
    };
    const onMouseOut = () => {
      setTooltipVisible(false);
    };

    return (
      <>
        {tooltipVisible && (
          <Tooltip topOffset={tooltipOffset} isCode={isCode}>
            {displayTitle}
          </Tooltip>
        )}
        <a
          ref={ref}
          onMouseOver={onMouseOver}
          onMouseOut={onMouseOut}
          style={{ paddingLeft }}
          href={'#' + slug}
          onClick={onClick}
          className={`
            ${STYLES_LINK}
            ${isNested && STYLES_LINK_HEADER}
            ${isCode && STYLES_LINK_CODE}
            ${isActive && STYLES_LINK_ACTIVE}
          `}>
          {displayTitle}
        </a>
      </>
    );
  }
);

export default DocumentationSidebarRightLink;
