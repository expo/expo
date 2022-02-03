import { css } from '@emotion/react';
import { theme, palette, typography } from '@expo/styleguide';
import * as React from 'react';

import { BASE_HEADING_LEVEL, Heading, HeadingType } from '../common/headingManager';

import { paragraph } from '~/components/base/typography';

const STYLES_LINK = css`
  ${paragraph}
  color: ${theme.text.secondary};
  transition: 50ms ease color;
  font-size: 14px;
  display: block;
  text-decoration: none;
  margin-bottom: 6px;
  cursor: pointer;

  :hover {
    color: ${theme.link.default};
  }
`;

const STYLES_LINK_HEADER = css`
  font-family: ${typography.fontFaces.medium};
`;

const STYLES_LINK_CODE = css`
  font-family: ${typography.fontFaces.mono};
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const STYLES_LINK_ACTIVE = css`
  color: ${theme.link.default};
`;

const STYLES_TOOLTIP = css`
  border-radius: 3px;
  position: absolute;
  background-color: ${palette.dark.white};
  font-family: ${typography.fontFaces.medium};
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
  font-family: ${typography.fontFaces.mono};
  font-size: 11px;
`;

const NESTING_OFFSET = 16;

/**
 * Replaces `Module.someFunction(arguments: argType)`
 * with `someFunction()`
 */
const trimCodedTitle = (str: string) => {
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
const isOverflowing = (el: HTMLElement) => {
  if (!el) {
    return false;
  }

  return el.clientWidth < el.scrollWidth;
};

type TooltipProps = {
  isCode?: boolean;
  topOffset: number;
};

const Tooltip: React.FC<TooltipProps> = ({ children, isCode, topOffset }) => (
  <div css={[STYLES_TOOLTIP, isCode && STYLES_CODE_TOOLTIP]} style={{ right: 20, top: topOffset }}>
    {children}
  </div>
);

type SidebarLinkProps = {
  heading: Heading;
  isActive: boolean;
  shortenCode: boolean;
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
};

const DocumentationSidebarRightLink = React.forwardRef<HTMLAnchorElement, SidebarLinkProps>(
  ({ heading, isActive, shortenCode, onClick }, ref) => {
    const { slug, level, title, type } = heading;

    const isNested = level <= BASE_HEADING_LEVEL;
    const isCode = type === HeadingType.InlineCode;

    const paddingLeft = NESTING_OFFSET * (level - BASE_HEADING_LEVEL) + 'px';
    const displayTitle = shortenCode && isCode ? trimCodedTitle(title) : title;

    const [tooltipVisible, setTooltipVisible] = React.useState(false);
    const [tooltipOffset, setTooltipOffset] = React.useState(-20);
    const onMouseOver = (event: React.MouseEvent<HTMLAnchorElement>) => {
      setTooltipVisible(isOverflowing(event.currentTarget));
      setTooltipOffset(event.currentTarget.getBoundingClientRect().top + 25);
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
          css={[
            STYLES_LINK,
            isNested && STYLES_LINK_HEADER,
            isCode && STYLES_LINK_CODE,
            isActive && STYLES_LINK_ACTIVE,
          ]}>
          {displayTitle}
        </a>
      </>
    );
  }
);

export default DocumentationSidebarRightLink;
