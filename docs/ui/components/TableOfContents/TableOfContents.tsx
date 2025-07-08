import { Button, ButtonBase, mergeClasses } from '@expo/styleguide';
import { ArrowCircleUpIcon } from '@expo/styleguide-icons/outline/ArrowCircleUpIcon';
import { ChevronDownIcon } from '@expo/styleguide-icons/outline/ChevronDownIcon';
import { LayoutAlt03Icon } from '@expo/styleguide-icons/outline/LayoutAlt03Icon';
import { useRouter } from 'next/compat/router';
import {
  PropsWithChildren,
  RefObject,
  MouseEvent,
  forwardRef,
  useState,
  useRef,
  useImperativeHandle,
  useEffect,
  SyntheticEvent,
} from 'react';

import { BASE_HEADING_LEVEL, Heading } from '~/common/headingManager';
import { isVersionedPath } from '~/common/routes';
import { prefersReducedMotion } from '~/common/window';
import { HeadingManagerProps, HeadingsContext } from '~/common/withHeadingManager';
import { ScrollContainer } from '~/components/ScrollContainer';
import { CALLOUT } from '~/ui/components/Text';

import { TableOfContentsLink } from './TableOfContentsLink';

const UPPER_SCROLL_LIMIT_FACTOR = 1 / 4;
const LOWER_SCROLL_LIMIT_FACTOR = 3 / 4;
const ACTIVE_ITEM_OFFSET_FACTOR = 1 / 20;

export type TableOfContentsProps = PropsWithChildren<{
  maxNestingDepth?: number;
  selfRef?: RefObject<ScrollContainer | null>;
  contentRef?: RefObject<ScrollContainer | null>;
}>;

export type TableOfContentsHandles = {
  handleContentScroll?: (contentScrollPosition: number) => void;
};

export const TableOfContents = forwardRef<
  TableOfContentsHandles,
  HeadingManagerProps & TableOfContentsProps
>(({ headingManager: { headings }, contentRef, selfRef, maxNestingDepth = 4 }, ref) => {
  const router = useRouter();
  const isVersioned = isVersionedPath(router?.pathname ?? '');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [activeParentSlug, setActiveParentSlug] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [collapsedH3s, setCollapsedH3s] = useState<Set<string>>(() =>
    isVersioned
      ? new Set(headings.filter(h => h.level === BASE_HEADING_LEVEL + 1).map(h => h.slug))
      : new Set()
  );

  const slugScrollingTo = useRef<string | null>(null);
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(function didMount() {
    if (contentRef?.current) {
      handleContentScroll(contentRef.current.getScrollTop());
    }
    setReducedMotion(prefersReducedMotion());
  }, []);

  useEffect(
    function didActiveSlugChanged() {
      updateSelfScroll();
    },
    [activeSlug]
  );

  useImperativeHandle(ref, () => ({ handleContentScroll }), []);

  function handleContentScroll(contentScrollPosition: number) {
    for (const { ref, slug, level } of headings) {
      if (!ref?.current) {
        continue;
      }

      setShowScrollTop(contentScrollPosition > 120);

      const isInView =
        ref.current.offsetTop >=
          contentScrollPosition + window.innerHeight * ACTIVE_ITEM_OFFSET_FACTOR &&
        ref.current.offsetTop <= contentScrollPosition + window.innerHeight / 2;

      if (isInView) {
        if (level > BASE_HEADING_LEVEL + 1 && isVersioned) {
          const currentIndex = headings.findIndex(h => h.slug === slug);
          for (let i = currentIndex; i >= 0; i--) {
            const h = headings[i];
            if (h.level === BASE_HEADING_LEVEL + 1) {
              setActiveParentSlug(h.slug);
              setActiveSlug(slug);
              updateSelfScroll();
              return;
            }
          }
        }
        if (slug !== activeSlug) {
          if (slug === slugScrollingTo.current) {
            slugScrollingTo.current = null;
          }
          setActiveParentSlug(null);
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

    if (activeItemPos < scrollTop + upperThreshold) {
      selfScroll.scrollTo({
        behavior: reducedMotion ? 'instant' : 'auto',
        top: Math.max(0, activeItemPos - upperThreshold),
      });
    } else if (activeItemPos > scrollTop + lowerThreshold) {
      selfScroll.scrollTo({
        behavior: reducedMotion ? 'instant' : 'auto',
        top: activeItemPos - lowerThreshold,
      });
    }
  }

  function handleLinkClick(event: MouseEvent, { slug, ref, type }: Heading) {
    event.preventDefault();

    slugScrollingTo.current = slug;

    const scrollOffset = type === 'inlineCode' ? 35 : 21;

    contentRef?.current?.getScrollRef().current?.scrollTo({
      behavior: reducedMotion ? 'instant' : 'smooth',
      top: ref.current?.offsetTop - window.innerHeight * ACTIVE_ITEM_OFFSET_FACTOR - scrollOffset,
    });

    if (history?.replaceState) {
      history.replaceState(history.state, '', '#' + slug);
    }
  }

  function handleTopClick(event: MouseEvent) {
    event.preventDefault();

    contentRef?.current?.getScrollRef().current?.scrollTo({
      behavior: reducedMotion ? 'instant' : 'smooth',
      top: 0,
    });

    if (history?.replaceState) {
      history.replaceState(history.state, '', ' ');
    }
  }

  const toggleH3 = (slug: string, event: SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setCollapsedH3s(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slug)) {
        newSet.delete(slug);
      } else {
        newSet.add(slug);
      }
      return newSet;
    });
  };

  const displayedHeadings = headings.filter(
    head =>
      head.level <= BASE_HEADING_LEVEL + maxNestingDepth && head.title.toLowerCase() !== 'see also'
  );

  const renderTOC = () => {
    let currentH3: string | null = null;

    return displayedHeadings.map((heading, index) => {
      const isActive = heading.slug === activeSlug || heading.slug === activeParentSlug;
      const isH3 = heading.level === BASE_HEADING_LEVEL + 1;

      if (isH3 && isVersioned) {
        currentH3 = heading.slug;
      } else if (heading.level <= BASE_HEADING_LEVEL) {
        currentH3 = null;
      }

      const parentH3 = currentH3 ?? '';
      const shouldHide =
        Boolean(currentH3) && heading.level > BASE_HEADING_LEVEL + 1 && collapsedH3s.has(parentH3);

      if (shouldHide) {
        return null;
      }

      const hasChildren =
        isH3 &&
        (() => {
          for (let i = index + 1; i < displayedHeadings.length; i++) {
            const nextHeading = displayedHeadings[i];
            if (nextHeading.level <= heading.level) {
              break;
            }
            if (nextHeading.level > heading.level) {
              return true;
            }
          }
          return false;
        })();

      return (
        <div
          key={heading.slug}
          className={mergeClasses(
            'flex items-center',
            currentH3 && heading.level > BASE_HEADING_LEVEL + 2 && 'ml-0',
            hasChildren && isVersioned && '-ml-2'
          )}>
          {hasChildren && isVersioned && (
            <ButtonBase
              onClick={event => {
                toggleH3(heading.slug, event);
              }}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  toggleH3(heading.slug, event);
                }
              }}
              aria-expanded={!collapsedH3s.has(heading.slug)}
              aria-controls={`toc-section-${heading.slug}`}
              className="-mr-2 flex h-full cursor-pointer items-center justify-center self-start pt-0.5 hocus:opacity-75"
              aria-label={`${collapsedH3s.has(heading.slug) ? 'Expand' : 'Collapse'} section ${heading.title}`}>
              <ChevronDownIcon
                className={mergeClasses(
                  'icon-sm text-icon-secondary transition-transform',
                  collapsedH3s.has(heading.slug) ? '-rotate-90' : 'rotate-0'
                )}
              />
            </ButtonBase>
          )}
          <TableOfContentsLink
            heading={heading}
            onClick={event => {
              handleLinkClick(event, heading);
            }}
            isActive={isActive}
            ref={isActive ? activeItemRef : undefined}
            shortenCode
          />
        </div>
      );
    });
  };

  return (
    <nav className="w-[280px] px-6 pb-10 pt-[52px]" data-toc>
      <CALLOUT
        weight="medium"
        className={mergeClasses(
          'absolute z-[100] -ml-6 -mt-[52px] flex min-h-[32px] w-[272px] select-none',
          'items-center gap-2 bg-gradient-to-b from-default from-80% to-transparent py-3 pl-6'
        )}>
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
      <div role="tree">{renderTOC()}</div>
    </nav>
  );
});

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
