import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

export type TableOfContentsOptions = {
  /** The root containing element to search for headings and observe them scrolling */
  root?: Element;
  /** The query selector to fetch all headings, defaults to `h2, h3` */
  selector?: string;
};

/**
 * Find the headings within an element to generate a table of contents.
 * This also uses an intersection observer to detect whenever headings are visible.
 *
 * @todo Remove "first flash of unstyled content" by extracting headings from MDX
 */
export function useTableOfContents(options: TableOfContentsOptions = {}) {
  const [activeId, setActiveId] = useState<string>();
  const headings = useHeadings(options.root, options.selector);
  const router = useRouter();

  useObserver(options.root, setActiveId, headings);

  const onRouteChange = useCallback(
    (url: string) => setActiveId(new URL(url, 'https://docs.expo.dev').hash),
    [setActiveId]
  );

  useEffect(function onDidMount() {
    router.events.on('hashChangeStart', onRouteChange);
    if (window.location.hash) {
      onRouteChange(window.location.hash);
    }
    return () => router.events.off('hashChangeStart', onRouteChange);
  }, []);

  return { headings, activeId };
}

/**
 * Find the heading elements within a root element.
 */
function useHeadings(root: Element | undefined, selector = 'h2, h3') {
  const [headings, setHeadings] = useState<HTMLHeadingElement[]>([]);

  useEffect(
    function onDidMount() {
      const elements = root?.querySelectorAll<HTMLHeadingElement>(selector);
      if (elements?.length) {
        setHeadings(Array.from(elements));
      } else {
        setHeadings([]);
      }
    },
    [root, selector]
  );

  return headings;
}

/**
 * Observe elements to detect them being scrolled in and out of view.
 * This uses an intersection observer under the hood.
 */
function useObserver(
  root: Element | undefined,
  onVisible: (id: string) => any,
  observerables: Element[]
) {
  // TODO(cedric): find a better way to detect changes of the observerables
  const observerablesHash = observerables.map(el => getHeadingId(el as HTMLElement)).join('');

  const onObserve = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const visible = entries.filter(entry => entry.isIntersecting);
      if (visible.length === 1) {
        // TODO(cedric): move the heading id back the the heading element
        onVisible(getHeadingId(visible[0].target as HTMLElement));
      } else if (visible.length > 1) {
        const sorted = visible.sort(
          (a, b) => observerables.indexOf(a.target) - observerables.indexOf(b.target)
        );
        onVisible(getHeadingId(sorted[0].target as HTMLElement));
      }
    },
    [onVisible, observerablesHash]
  );

  useEffect(
    function onDidMount() {
      const observer = new IntersectionObserver(onObserve, {
        root,
        // TODO(cedric): make sure these margins are tweaked properly with the new heading components
        rootMargin: '-25% 0px -50% 0px',
      });
      observerables.forEach(observerable => observer.observe(observerable));
      return () => observer.disconnect();
    },
    [root, onVisible, onObserve, observerablesHash]
  );
}

/**
 * Get the ID by heading element.
 * This is added by the PermaLink component.
 *
 * @todo Try to just use ID instead of this workaround
 */
export function getHeadingId(element: HTMLElement): string {
  return element.id || element.dataset.id || '';
}
