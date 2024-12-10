import { mergeClasses } from '@expo/styleguide';
import Link from 'next/link';
import { forwardRef, useState, type MouseEvent } from 'react';

import { BASE_HEADING_LEVEL, Heading, HeadingType } from '~/common/headingManager';
import { MONOSPACE, CALLOUT, FOOTNOTE } from '~/ui/components/Text';
import * as Tooltip from '~/ui/components/Tooltip';

type SidebarLinkProps = {
  heading: Heading;
  isActive: boolean;
  shortenCode: boolean;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export const TableOfContentsLink = forwardRef<HTMLAnchorElement, SidebarLinkProps>(
  ({ heading: { slug, level, title, type, tags }, isActive, shortenCode, onClick }, ref) => {
    const [tooltipVisible, setTooltipVisible] = useState(false);

    // preset for monospace, tail ellipsis, and removing extra bits like details of function signatures
    const isCode = type === HeadingType.InlineCode;
    // preset for monospace, tail ellipsis, don't touch the title otherwise
    const isCodeOrFilePath = isCode || type === HeadingType.CodeFilePath;

    const TitleElement = isCodeOrFilePath ? MONOSPACE : CALLOUT;
    const displayTitle = shortenCode && isCode ? trimCodedTitle(title) : title;
    const isDeprecated = tags && tags.length > 0 ? tags.find(tag => tag === 'deprecated') : null;

    function onMouseOver(event: MouseEvent<HTMLAnchorElement>) {
      setTooltipVisible(isOverflowing(event.currentTarget));
    }

    function onMouseOut() {
      setTooltipVisible(false);
    }

    return (
      <Tooltip.Root open={tooltipVisible}>
        <Tooltip.Trigger asChild>
          <Link
            ref={ref}
            onMouseOver={isCode ? onMouseOver : undefined}
            onMouseOut={isCode ? onMouseOut : undefined}
            href={'#' + slug}
            onClick={onClick}
            className={mergeClasses(
              'mb-1.5 flex items-center justify-between truncate !text-pretty',
              convertToIndentClass(level - BASE_HEADING_LEVEL),
              'focus-visible:relative focus-visible:z-10'
            )}>
            <TitleElement
              className={mergeClasses(
                'w-full !text-secondary hocus:!text-link',
                isCodeOrFilePath && 'truncate !text-2xs',
                isActive && '!text-link',
                isDeprecated && 'line-through opacity-80'
              )}>
              {displayTitle}
            </TitleElement>
          </Link>
        </Tooltip.Trigger>
        <Tooltip.Content
          side="bottom"
          align="start"
          collisionPadding={{
            right: 22,
          }}>
          <FOOTNOTE tag={isCode ? 'code' : undefined}>{displayTitle}</FOOTNOTE>
        </Tooltip.Content>
      </Tooltip.Root>
    );
  }
);

/**
 * Replaces `Module.someFunction<T>(arguments: argType)` with `someFunction()`
 */
function trimCodedTitle(str: string) {
  if (!str.includes('...')) {
    const dotIdx = str.indexOf('.');
    if (dotIdx > 0) str = str.substring(dotIdx + 1);
  }

  str = str.replace(/<.+>/g, '');

  const parIdx = str.indexOf('(');
  if (parIdx > 0) str = str.substring(0, parIdx + 1) + ')';

  return str;
}

/**
 * Determines if element is overflowing (children width exceeds container width).
 * @param {HTMLElement} el HTML element to check
 */
function isOverflowing(el: HTMLElement) {
  if (!el || !el.children) {
    return false;
  }

  const childrenWidth = Array.from(el.children).reduce((sum, child) => sum + child.scrollWidth, 0);
  const indent = parseInt(window.getComputedStyle(el).paddingLeft, 10);
  return childrenWidth > 220 && childrenWidth >= el.scrollWidth - indent;
}

function convertToIndentClass(spacing: number) {
  switch (spacing) {
    case 1:
      return 'pl-3';
    case 2:
      return 'pl-6';
    case 3:
      return 'pl-9';
    case 4:
      return 'pl-12';
    case 5:
      return 'pl-15';
    default:
      return '';
  }
}
