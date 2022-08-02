import { css } from '@emotion/react';
import { theme, typography } from '@expo/styleguide';
import * as React from 'react';

import { BASE_HEADING_LEVEL, Heading, HeadingType } from '~/common/headingManager';
import { paragraph } from '~/components/base/typography';
import { Tag } from '~/ui/components/Tag';

const STYLES_LINK = css`
  ${paragraph}
  color: ${theme.text.secondary};
  transition: 50ms ease color;
  font-size: 14px;
  display: flex;
  text-decoration: none;
  margin-bottom: 6px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  align-items: center;
  justify-content: space-between;

  :hover {
    color: ${theme.link.default};
  }
`;

const STYLES_LINK_HEADER = css`
  font-family: ${typography.fontFaces.medium};
`;

const STYLES_LINK_LABEL = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const STYLES_LINK_CODE = css`
  font-family: ${typography.fontFaces.mono};
  font-size: 13px;
`;

const STYLES_LINK_ACTIVE = css`
  color: ${theme.link.default};
`;

const STYLES_TOOLTIP = css`
  ${typography.fontSizes[13]}
  border-radius: 3px;
  position: absolute;
  color: ${theme.text.default};
  background-color: ${theme.background.secondary};
  font-family: ${typography.fontFaces.medium};
  max-width: 400px;
  border: 1px solid ${theme.border.default};
  padding: 3px 6px;
  word-break: break-word;
  word-wrap: normal;
  display: inline-block;
`;

const STYLES_CODE_TOOLTIP = css`
  font-family: ${typography.fontFaces.mono};
  font-size: 11px;
`;

const STYLES_TAG_CONTAINER = css`
  display: inline-flex;
`;

const NESTING_OFFSET = 12;

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
 * (its children width exceeds container width)
 * @param {HTMLElement} el element to check
 */
const isOverflowing = (el: HTMLElement) => {
  if (!el || !el.children) {
    return false;
  }

  const childrenWidth = Array.from(el.children).reduce((sum, child) => sum + child.scrollWidth, 0);
  return childrenWidth >= el.scrollWidth;
};

type TooltipProps = React.PropsWithChildren<{
  isCode?: boolean;
  topOffset: number;
}>;

const Tooltip = ({ children, isCode, topOffset }: TooltipProps) => (
  <div css={[STYLES_TOOLTIP, isCode && STYLES_CODE_TOOLTIP]} style={{ right: 24, top: topOffset }}>
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
    const { slug, level, title, type, tags } = heading;

    const isNested = level <= BASE_HEADING_LEVEL;
    const isCode = type === HeadingType.InlineCode;

    const paddingLeft = NESTING_OFFSET * (level - BASE_HEADING_LEVEL) + 'px';
    const displayTitle = shortenCode && isCode ? trimCodedTitle(title) : title;

    const [tooltipVisible, setTooltipVisible] = React.useState(false);
    const [tooltipOffset, setTooltipOffset] = React.useState(-20);
    const onMouseOver = (event: React.MouseEvent<HTMLAnchorElement>) => {
      setTooltipVisible(isOverflowing(event.currentTarget));
      setTooltipOffset(
        event.currentTarget.getBoundingClientRect().top + event.currentTarget.offsetHeight
      );
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
          css={[STYLES_LINK, isNested && STYLES_LINK_HEADER, isActive && STYLES_LINK_ACTIVE]}>
          <span css={[STYLES_LINK_LABEL, isCode && STYLES_LINK_CODE]}>{displayTitle}</span>
          {tags && tags.length ? (
            <div css={STYLES_TAG_CONTAINER}>
              {tags.map(tag => (
                <Tag name={tag} type="toc" />
              ))}
            </div>
          ) : undefined}
        </a>
      </>
    );
  }
);

export default DocumentationSidebarRightLink;
