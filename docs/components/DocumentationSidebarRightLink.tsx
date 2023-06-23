import { css } from '@emotion/react';
import { theme, typography } from '@expo/styleguide';
import Link from 'next/link';
import * as React from 'react';

import { BASE_HEADING_LEVEL, Heading, HeadingType } from '~/common/headingManager';
import { Tag } from '~/ui/components/Tag';
import { MONOSPACE, CALLOUT } from '~/ui/components/Text';

const STYLES_LINK = css`
  transition: 50ms ease color;
  display: flex;
  text-decoration: none;
  margin-bottom: 6px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  align-items: center;
  justify-content: space-between;
`;

const STYLES_LINK_LABEL = css`
  color: ${theme.text.secondary};

  :hover {
    color: ${theme.text.link};
  }
`;

const STYLES_LINK_MONOSPACE = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${typography.fontSizes[13]}
`;

const STYLES_LINK_ACTIVE = css`
  color: ${theme.text.link};
`;

const STYLES_TOOLTIP = css`
  border-radius: 3px;
  position: absolute;
  background-color: ${theme.background.subtle};
  max-width: 400px;
  border: 1px solid ${theme.border.default};
  padding: 3px 6px;
  display: inline-block;
`;

const STYLES_TOOLTIP_TEXT = css`
  ${typography.fontSizes[13]}
  color: ${theme.text.default};
  word-break: break-word;
  word-wrap: normal;
`;

const STYLES_TOOLTIP_CODE = css`
  ${typography.fontSizes[12]}
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
  const indent = parseInt(window.getComputedStyle(el).paddingLeft, 10);
  return childrenWidth >= el.scrollWidth - indent;
};

type TooltipProps = React.PropsWithChildren<{
  isCode?: boolean;
  topOffset: number;
}>;

const Tooltip = ({ children, isCode, topOffset }: TooltipProps) => {
  const ContentWrapper = isCode ? MONOSPACE : CALLOUT;
  return (
    <div css={STYLES_TOOLTIP} style={{ right: 24, top: topOffset }}>
      <ContentWrapper css={[STYLES_TOOLTIP_TEXT, isCode && STYLES_TOOLTIP_CODE]}>
        {children}
      </ContentWrapper>
    </div>
  );
};

type SidebarLinkProps = {
  heading: Heading;
  isActive: boolean;
  shortenCode: boolean;
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
};

const DocumentationSidebarRightLink = React.forwardRef<HTMLAnchorElement, SidebarLinkProps>(
  ({ heading, isActive, shortenCode, onClick }, ref) => {
    const { slug, level, title, type, tags } = heading;

    const isCode = type === HeadingType.InlineCode;
    const paddingLeft = NESTING_OFFSET * (level - BASE_HEADING_LEVEL);
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

    const TitleElement = isCode ? MONOSPACE : CALLOUT;

    return (
      <>
        {tooltipVisible && isCode && (
          <Tooltip topOffset={tooltipOffset} isCode={isCode}>
            {displayTitle}
          </Tooltip>
        )}
        <Link
          ref={ref}
          onMouseOver={isCode ? onMouseOver : undefined}
          onMouseOut={isCode ? onMouseOut : undefined}
          href={'#' + slug}
          onClick={onClick}
          css={[STYLES_LINK, paddingLeft && { paddingLeft }]}>
          <TitleElement
            css={[
              STYLES_LINK_LABEL,
              isCode && STYLES_LINK_MONOSPACE,
              isActive && STYLES_LINK_ACTIVE,
            ]}>
            {displayTitle}
          </TitleElement>
          {tags && tags.length ? (
            <div css={STYLES_TAG_CONTAINER}>
              {tags.map(tag => (
                <Tag name={tag} type="toc" key={`${displayTitle}-${tag}`} />
              ))}
            </div>
          ) : undefined}
        </Link>
      </>
    );
  }
);

export default DocumentationSidebarRightLink;
