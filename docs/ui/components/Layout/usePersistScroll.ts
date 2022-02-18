import { UIEvent, useCallback, useEffect, useRef } from 'react';

/** The list of persisted scroll positions, by id */
const scrollPositions: Record<string, number> = {};

/**
 * Keep track and restore the scroll position when changing page.
 * The ID is used to identify the stored scroll position.
 */
export function usePersistScroll<T extends HTMLElement = HTMLDivElement>(id: string) {
  const ref = useRef<T>(null);

  const onScroll = useCallback((event: UIEvent<T>) => {
    scrollPositions[id] = event.currentTarget.scrollTop;
  }, []);

  useEffect(
    function scrollRefDidMount() {
      if (ref.current && scrollPositions[id] > 0) {
        ref.current.scrollTop = scrollPositions[id];
      }
    },
    [ref.current]
  );

  return { ref, onScroll };
}
