import { Button, mergeClasses } from '@expo/styleguide';
import { ArrowCircleUpIcon } from '@expo/styleguide-icons/outline/ArrowCircleUpIcon';
import { ChevronDownIcon } from '@expo/styleguide-icons/outline/ChevronDownIcon';
import { ChevronRightIcon } from '@expo/styleguide-icons/outline/ChevronRightIcon';
import { LayoutAlt03Icon } from '@expo/styleguide-icons/outline/LayoutAlt03Icon';
import { useRouter } from 'next/router';
import {
  PropsWithChildren,
  RefObject,
  MouseEvent,
  forwardRef,
  useState,
  useRef,
  useImperativeHandle,
  useEffect,
  useMemo,
} from 'react';

import { BASE_HEADING_LEVEL, Heading } from '~/common/headingManager';
import { prefersReducedMotion } from '~/common/window';
import { HeadingManagerProps, HeadingsContext } from '~/common/withHeadingManager';
import { ScrollContainer } from '~/components/ScrollContainer';
import { TableOfContentsLink } from '~/ui/components/TableOfContents';
import { CALLOUT } from '~/ui/components/Text';

const UPPER_SCROLL_LIMIT_FACTOR = 1 / 4;
const LOWER_SCROLL_LIMIT_FACTOR = 3 / 4;
const ACTIVE_ITEM_OFFSET_FACTOR = 1 / 20;

export type TableOfContentsProps = PropsWithChildren<{
  maxNestingDepth?: number;
  selfRef?: RefObject<ScrollContainer>;
  contentRef?: RefObject<ScrollContainer>;
}>;

export type TableOfContentsHandles = {
  handleContentScroll?: (contentScrollPosition: number) => void;
};

interface GroupedHeading {
  parent: Heading;
  children: Heading[];
}

export const TableOfContents = forwardRef<
  TableOfContentsHandles,
  HeadingManagerProps & TableOfContentsProps
>(({ headingManager: { headings }, contentRef, selfRef, maxNestingDepth = 4 }, ref) => {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const router = useRouter();
  const isVersionsPath = router.asPath.startsWith('/versions/');

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

      if (isVersionsPath && activeSlug && groupedHeadings) {
        for (const group of groupedHeadings) {
          const childInGroup = group.children.find(child => child.slug === activeSlug);
          if (childInGroup) {
            setExpandedGroups(prev => ({ ...prev, [group.parent.slug]: true }));
            break;
          }
        }
      }
    },
    [activeSlug]
  );

  useImperativeHandle(ref, () => ({ handleContentScroll }), []);

  function handleContentScroll(contentScrollPosition: number) {
    for (const { ref, slug } of headings) {
      if (!ref?.current) {
        continue;
      }

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

  function toggleGroup(slug: string) {
    setExpandedGroups(prev => ({
      ...prev,
      [slug]: !prev[slug],
    }));
  }

  const displayedHeadings = headings.filter(
    head =>
      head.level <= BASE_HEADING_LEVEL + maxNestingDepth && head.title.toLowerCase() !== 'see also'
  );

  const groupedHeadings = useMemo(() => {
    if (!isVersionsPath) {
      return null;
    }

    const groups: GroupedHeading[] = [];
    const level1And2Headings = displayedHeadings.filter(h => h.level <= BASE_HEADING_LEVEL + 1);

    const parentHeadings = level1And2Headings.filter(h => h.level === BASE_HEADING_LEVEL + 1);

    for (const parent of parentHeadings) {
      const parentIndex = displayedHeadings.findIndex(h => h.slug === parent.slug);
      if (parentIndex === -1) {
        continue;
      }

      const childHeadings: Heading[] = [];
      let i = parentIndex + 1;

      while (
        i < displayedHeadings.length &&
        displayedHeadings[i].level > parent.level &&
        (i === parentIndex + 1 || displayedHeadings[i - 1].level !== BASE_HEADING_LEVEL + 1)
      ) {
        childHeadings.push(displayedHeadings[i]);
        i++;
      }

      if (childHeadings.length > 0) {
        groups.push({
          parent,
          children: childHeadings,
        });
      }
    }

    return groups;
  }, [displayedHeadings, isVersionsPath]);

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

      {isVersionsPath && groupedHeadings ? (
        <>
          {displayedHeadings
            .slice(
              0,
              displayedHeadings.findIndex(h => groupedHeadings.some(g => g.parent.slug === h.slug))
            )
            .map(heading => {
              const isActive = heading.slug === activeSlug;
              return (
                <TableOfContentsLink
                  key={heading.slug}
                  heading={heading}
                  onClick={event => {
                    handleLinkClick(event, heading);
                  }}
                  isActive={isActive}
                  ref={isActive ? activeItemRef : undefined}
                  shortenCode
                />
              );
            })}
          {groupedHeadings.map(group => {
            const isParentActive = group.parent.slug === activeSlug;
            const isGroupExpanded = !!expandedGroups[group.parent.slug];

            return (
              <div key={group.parent.slug}>
                <div
                  className="group flex cursor-pointer items-center"
                  onClick={() => {
                    toggleGroup(group.parent.slug);
                  }}>
                  <div className="flex h-full items-center justify-center self-start pt-[4px]">
                    {isGroupExpanded ? (
                      <ChevronDownIcon className="icon-xs text-icon-secondary" />
                    ) : (
                      <ChevronRightIcon className="icon-xs text-icon-secondary" />
                    )}
                  </div>
                  <div className="w-full">
                    <TableOfContentsLink
                      key={group.parent.slug}
                      heading={group.parent}
                      onClick={event => {
                        event.stopPropagation();
                        handleLinkClick(event, group.parent);
                      }}
                      isActive={isParentActive}
                      ref={isParentActive ? activeItemRef : undefined}
                      shortenCode
                    />
                  </div>
                </div>

                {isGroupExpanded &&
                  group.children.map(child => {
                    const isChildActive = child.slug === activeSlug;
                    return (
                      <div className="ml-3" key={child.slug}>
                        <TableOfContentsLink
                          key={child.slug}
                          heading={child}
                          onClick={event => {
                            handleLinkClick(event, child);
                          }}
                          isActive={isChildActive}
                          ref={isChildActive ? activeItemRef : undefined}
                          shortenCode
                        />
                      </div>
                    );
                  })}
              </div>
            );
          })}

          {(() => {
            if (groupedHeadings.length === 0) {
              return null;
            }

            const lastGroup = groupedHeadings.at(-1)!;
            const lastGroupIndex = displayedHeadings.findIndex(
              h => h.slug === lastGroup.parent.slug
            );

            if (lastGroupIndex === -1) {
              return null;
            }

            let lastChildIndex = lastGroupIndex;

            if (lastGroup.children.length > 0) {
              const lastChild = lastGroup.children.at(-1)!;
              lastChildIndex = displayedHeadings.findIndex(h => h.slug === lastChild.slug);
            }

            return displayedHeadings.slice(lastChildIndex + 1).map(heading => {
              const isActive = heading.slug === activeSlug;
              return (
                <div key={heading.slug}>
                  <TableOfContentsLink
                    key={heading.slug}
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
          })()}
        </>
      ) : (
        // Default non-collapsible rendering for other pages
        displayedHeadings.map(heading => {
          const isActive = heading.slug === activeSlug;
          return (
            <TableOfContentsLink
              key={heading.slug}
              heading={heading}
              onClick={event => {
                handleLinkClick(event, heading);
              }}
              isActive={isActive}
              ref={isActive ? activeItemRef : undefined}
              shortenCode
            />
          );
        })
      )}
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
