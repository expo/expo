import { mergeClasses } from '@expo/styleguide';
import Link from 'next/link';
import { forwardRef, useState, type MouseEvent } from 'react';

import { BASE_HEADING_LEVEL, Heading, HeadingType } from '~/common/headingManager';
import { Tag } from '~/ui/components/Tag';
import { MONOSPACE, CALLOUT, FOOTNOTE } from '~/ui/components/Text';
import * as Tooltip from '~/ui/components/Tooltip';

const NESTING_OFFSET = 12;

type SidebarLinkProps = {
  heading: Heading;
  isActive: boolean;
  shortenCode: boolean;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
};

const DocumentationSidebarRightLink = forwardRef<HTMLAnchorElement, SidebarLinkProps>(
  ({ heading, isActive, shortenCode, onClick }, ref) => {
    const { slug, level, title, type, tags } = heading;

    // preset for monospace, tail ellipsis, and removing extra bits like details of function signatures
    const isCode = type === HeadingType.InlineCode;
    // preset for monospace, tail ellipsis, don't touch the title otherwise
    const isCodeOrFilePath = isCode || type === HeadingType.CodeFilePath;

    const paddingLeft = NESTING_OFFSET * (level - BASE_HEADING_LEVEL);
    const displayTitle = shortenCode && isCode ? trimCodedTitle(title) : title;

    const [tooltipVisible, setTooltipVisible] = useState(false);
    const onMouseOver = (event: MouseEvent<HTMLAnchorElement>) => {
      setTooltipVisible(isOverflowing(event.currentTarget));
    };

    const onMouseOut = () => {
      setTooltipVisible(false);
    };

    const TitleElement = isCodeOrFilePath ? MONOSPACE : CALLOUT;

    return (
      <Tooltip.Root open={tooltipVisible}>
        <Tooltip.Trigger asChild>
          <Link
            ref={ref}
            onMouseOver={isCode ? onMouseOver : undefined}
            onMouseOut={isCode ? onMouseOut : undefined}
            href={'#' + slug}
            onClick={onClick}
            style={paddingLeft ? { paddingLeft } : undefined}
            className={mergeClasses(
              'flex mb-1.5 truncate items-center justify-between !text-pretty',
              'focus-visible:relative focus-visible:z-10'
            )}>
            <TitleElement
              className={mergeClasses(
                '!text-secondary hocus:!text-link',
                isCodeOrFilePath && 'truncate !text-2xs',
                isActive && '!text-link'
              )}>
              {displayTitle}
            </TitleElement>
            {tags && tags.length ? (
              <div className="inline-flex">
                {tags.map(tag => (
                  <Tag name={tag} type="toc" key={`${displayTitle}-${tag}`} />
                ))}
              </div>
            ) : undefined}
          </Link>
        </Tooltip.Trigger>
        <Tooltip.Content
          side="bottom"
          collisionPadding={{
            right: 22,
          }}>
          <FOOTNOTE tag="code">{displayTitle}</FOOTNOTE>
        </Tooltip.Content>
      </Tooltip.Root>
    );
  }
);

/**
 * Replaces `Module.someFunction(arguments: argType)` with `someFunction()`
 */
const trimCodedTitle = (str: string) => {
  const dotIdx = str.indexOf('.');
  if (dotIdx > 0) str = str.substring(dotIdx + 1);

  const parIdx = str.indexOf('(');
  if (parIdx > 0) str = str.substring(0, parIdx + 1) + ')';

  return str;
};

/**
 * Determines if element is overflowing (children width exceeds container width).
 * @param {HTMLElement} el HTML element to check
 */
const isOverflowing = (el: HTMLElement) => {
  if (!el || !el.children) {
    return false;
  }

  const childrenWidth = Array.from(el.children).reduce((sum, child) => sum + child.scrollWidth, 0);
  const indent = parseInt(window.getComputedStyle(el).paddingLeft, 10);
  return childrenWidth >= el.scrollWidth - indent;
};

export default DocumentationSidebarRightLink;
