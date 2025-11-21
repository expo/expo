import { mergeClasses } from '@expo/styleguide';
import {
  forwardRef,
  type PropsWithChildren,
  type RefObject,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

type ScrollContainerProps = PropsWithChildren<{
  className?: string;
  scrollPosition?: number;
  scrollHandler?: () => void;
}>;

export type ScrollContainerHandle = {
  getScrollTop: () => number;
  getScrollRef: () => RefObject<HTMLDivElement | null>;
};

export const ScrollContainer = forwardRef<ScrollContainerHandle, ScrollContainerProps>(
  ({ className, scrollPosition, scrollHandler, children }, ref) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (scrollPosition != null && scrollRef.current) {
        scrollRef.current.scrollTop = scrollPosition;
      }
    }, [scrollPosition]);

    useImperativeHandle(
      ref,
      () => ({
        getScrollTop: () => scrollRef.current?.scrollTop ?? 0,
        getScrollRef: () => scrollRef,
      }),
      []
    );

    return (
      <div
        className={mergeClasses('size-full overflow-y-auto overflow-x-hidden', className)}
        ref={scrollRef}
        onScroll={scrollHandler}>
        {children}
      </div>
    );
  }
);

ScrollContainer.displayName = 'ScrollContainer';
