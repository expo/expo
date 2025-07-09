import { useEffect, useRef } from 'react';

const UPPER_THRESHOLD = 1 / 4;
const LOWER_THRESHOLD = 3 / 4;

/**
 * Automatically scroll to a child element, by selector.
 * Whenever the selector changes, it tries to detect if the selector is out of view.
 * If it is, it will scroll to the closest upper or lower bound within the ref's scroll area.
 */
export function useAutoScrollTo<T extends HTMLElement = HTMLDivElement>(selector: string) {
  const ref = useRef<T>(null);

  useEffect(
    function onMaybeScroll() {
      if (!selector || !ref.current) {
        return;
      }
      const target = ref.current.querySelector<HTMLElement>(selector);
      if (target) {
        const bounds = ref.current.getBoundingClientRect();
        const position = ref.current.scrollTop;
        const targetPosition = target.offsetTop;
        const upperThreshold = bounds.height * UPPER_THRESHOLD;
        const lowerThreshold = bounds.height * LOWER_THRESHOLD;

        if (targetPosition < position + upperThreshold) {
          ref.current.scrollTo({ top: Math.max(0, targetPosition - upperThreshold) });
        } else if (targetPosition > position + lowerThreshold) {
          ref.current.scrollTo({ top: targetPosition - lowerThreshold });
        }
      }
    },
    [ref.current, selector]
  );

  return { ref };
}
