import { Button, mergeClasses } from '@expo/styleguide';
import { ArrowCircleUpIcon } from '@expo/styleguide-icons/outline/ArrowCircleUpIcon';
import { LayoutAlt03Icon } from '@expo/styleguide-icons/outline/LayoutAlt03Icon';
import {
  PropsWithChildren,
  LegacyRef,
  RefObject,
  MouseEvent,
  forwardRef,
  useState,
  useRef,
  useImperativeHandle,
  useEffect,
} from 'react';

import { BASE_HEADING_LEVEL, Heading } from '~/common/headingManager';
import { prefersReducedMotion } from '~/common/window';
import { HeadingManagerProps, HeadingsContext } from '~/common/withHeadingManager';
import { TableOfContentsLink } from '~/ui/components/TableOfContents';
import { CALLOUT } from '~/ui/components/Text';

const UPPER_SCROLL_LIMIT_FACTOR = 1 / 4;
const LOWER_SCROLL_LIMIT_FACTOR = 7 / 8;
const ACTIVE_ITEM_OFFSET_FACTOR = 1 / 20;

export type TableOfContentsProps = PropsWithChildren<{
  maxNestingDepth?: number;
  selfRef?: RefObject<any>;
  contentRef?: RefObject<any>;
}>;

export type TableOfContentsHandles = LegacyRef<HTMLElement> & {
  handleContentScroll?: (contentScrollPosition: number) => void;
};

export const TableOfContents = forwardRef<any, HeadingManagerProps & TableOfContentsProps>(
  ({ headingManager: { headings }, contentRef, selfRef, maxNestingDepth = 4 }, ref) => {
    const [activeSlug, setActiveSlug] = useState<string | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    const slugScrollingTo = useRef<string | null>(null);
    const activeItemRef = useRef<HTMLAnchorElement | null>(null);

    useEffect(function didMount() {
      handleContentScroll(contentRef?.current.getScrollTop());
    }, []);

    useEffect(
      function didActiveSlugChanged() {
        updateSelfScroll();
      },
      [activeSlug]
    );

    useImperativeHandle(ref, () => ({ handleContentScroll }), []);

    function handleContentScroll(contentScrollPosition: number) {
      for (const { ref, slug } of headings) {
        if (!ref || !ref.current) continue;

        setShowScrollTop(contentScrollPosition > 120);

        if (
          ref.current.offsetTop >=
            contentScrollPosition + window.innerHeight * ACTIVE_ITEM_OFFSET_FACTOR &&
          ref.current.offsetTop <= contentScrollPosition + window.innerHeight / 2
        ) {
          if (slug !== activeSlug) {
            if (slug === slugScrollingTo.current) {
              slugScrollingTo.current = null;
            }
            setActiveSlug(slug);
            updateSelfScroll();
          }
          return;
        }
      }
    }

    function updateSelfScroll() {
      const selfScroll = selfRef?.current?.getScrollRef().current;
      const activeItemPos = activeItemRef.current?.offsetTop;

      if (!selfScroll || !activeItemPos || slugScrollingTo.current) {
        return;
      }

      const { scrollTop } = selfScroll;
      const upperThreshold = window.innerHeight * UPPER_SCROLL_LIMIT_FACTOR;
      const lowerThreshold = window.innerHeight * LOWER_SCROLL_LIMIT_FACTOR;

      // console.log(activeItemPos < scrollTop + upperThreshold, activeItemPos > scrollTop + lowerThreshold)

      if (activeItemPos < scrollTop + upperThreshold) {
        selfScroll.scrollTo({
          behavior: 'auto',
          top: Math.max(0, activeItemPos - upperThreshold),
        });
      } else if (activeItemPos > scrollTop + lowerThreshold) {
        selfScroll.scrollTo({ behavior: 'auto', top: activeItemPos - lowerThreshold });
      }
    }

    function handleLinkClick(event: MouseEvent, { slug, ref, type }: Heading) {
      event.preventDefault();

      slugScrollingTo.current = slug;

      const scrollOffset = type === 'inlineCode' ? 50 : 26;

      contentRef?.current?.getScrollRef().current?.scrollTo({
        behavior: prefersReducedMotion() ? 'smooth' : 'instant',
        top: ref.current?.offsetTop - window.innerHeight * ACTIVE_ITEM_OFFSET_FACTOR - scrollOffset,
      });

      if (history?.replaceState) {
        history.replaceState(history.state, '', '#' + slug);
      }
    }

    function handleTopClick(event: MouseEvent) {
      event.preventDefault();

      contentRef?.current?.getScrollRef().current?.scrollTo({
        behavior: prefersReducedMotion() ? 'smooth' : 'instant',
        top: 0,
      });

      if (history?.replaceState) {
        history.replaceState(history.state, '', ' ');
      }
    }

    const displayedHeadings = headings.filter(
      head =>
        head.level <= BASE_HEADING_LEVEL + maxNestingDepth &&
        head.title.toLowerCase() !== 'see also'
    );

    return (
      <nav className="w-[280px] px-6 pb-10 pt-14" data-sidebar>
        <CALLOUT
          weight="medium"
          className="absolute z-10 -mt-14 mb-2 flex min-h-[32px] w-[248px] select-none items-center gap-2 bg-default pb-2 pt-4">
          <LayoutAlt03Icon className="icon-sm" /> On this page
          <Button
            theme="quaternary"
            size="xs"
            className={mergeClasses(
              'ml-auto mr-2 px-2 transition-opacity duration-300',
              !showScrollTop && 'pointer-events-none opacity-0'
            )}
            onClick={handleTopClick}>
            <ArrowCircleUpIcon className="icon-sm text-icon-secondary" aria-label="Scroll to top" />
          </Button>
        </CALLOUT>
        {displayedHeadings.map(heading => {
          const isActive = heading.slug === activeSlug;
          return (
            <TableOfContentsLink
              key={heading.slug}
              heading={heading}
              onClick={event => handleLinkClick(event, heading)}
              isActive={isActive}
              ref={isActive ? activeItemRef : undefined}
              shortenCode
            />
          );
        })}
      </nav>
    );
  }
);

export const TableOfContentsWithManager = forwardRef<TableOfContentsHandles, TableOfContentsProps>(
  (props, ref) => {
    return (
      <HeadingsContext.Consumer>
        {headingManager => (
          <TableOfContents ref={ref} headingManager={headingManager!} {...props} />
        )}
      </HeadingsContext.Consumer>
    );
  }
);
