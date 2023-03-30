import { useEffect, useRef, useState } from 'react';

export type HeadingEntry = {
  id: string;
  element: HTMLHeadingElement;
};

/**
 * Retrieve all headings matching the selector within the document.
 * This will search for all elements matching the heading tags, and generate a selector string.
 * The string can be used to properly initialize the intersection observer.
 * Currently, only headings with either an `[id="<id>"]` or `[data-id="<id>"]` are supported.
 */
export function useHeadingsObserver(tags = 'h2,h3') {
  const observerRef = useRef<IntersectionObserver>();
  const [headings, setHeadings] = useState<HeadingEntry[]>([]);
  const [activeId, setActiveId] = useState<string>();

  useEffect(
    function didMount() {
      const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>(tags)).map(
        element => ({ element, id: getHeadingId(element) })
      );

      function onObserve(entries: IntersectionObserverEntry[]) {
        const entry = getActiveEntry(entries);
        if (entry) {
          setActiveId(getHeadingId(entry.target as HTMLHeadingElement));
        }
      }

      observerRef.current = new IntersectionObserver(onObserve, {
        // TODO(cedric): make sure these margins are tweaked properly with the new heading components
        rootMargin: '-25% 0px -50% 0px',
      });

      setHeadings(headings);
      headings.forEach(heading => observerRef.current?.observe(heading.element));

      return function didUnmount() {
        observerRef.current?.disconnect();
      };
    },
    [tags]
  );

  return { headings, activeId };
}

/**
 * Get the unique identifier of the heading element.
 * This could either be `[id="<id>"]` or `[data-id="<id>"]`.
 */
function getHeadingId(heading: HTMLHeadingElement): string {
  return heading.id || heading.dataset.id || '';
}

/**
 * Find the most probable observer entry that should be considered "active".
 * If there are more than one, the upper heading (by offsetTop) is returned.
 */
function getActiveEntry(entries: IntersectionObserverEntry[]): IntersectionObserverEntry | null {
  const visible = entries.filter(entry => entry.isIntersecting);

  if (visible.length <= 0) {
    return null;
  } else if (visible.length === 1) {
    return visible[0];
  }

  const sorted = visible.sort(
    (a, b) =>
      (a.target as HTMLHeadingElement).offsetTop - (b.target as HTMLHeadingElement).offsetTop
  );

  return sorted[0];
}
