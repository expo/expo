import { mergeClasses } from '@expo/styleguide';
import { forwardRef, HTMLAttributes, PropsWithChildren } from 'react';

type LayoutScrollProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    /**
     * If the scroll container should smoothly scroll when scrolled programmatically.
     */
    smoothScroll?: boolean;
    /**
     * If the overscoll effect should be disabled.
     */
    disableOverscroll?: boolean;
  }
>;

export const LayoutScroll = forwardRef<HTMLDivElement, LayoutScrollProps>(
  ({ smoothScroll = true, disableOverscroll = true, children, ...rest }, ref) => (
    <div
      className={mergeClasses(
        'flex flex-1 overflow-y-auto overflow-x-hidden',
        smoothScroll && 'scroll-smooth',
        disableOverscroll && 'overscroll-contain'
      )}
      {...rest}
      ref={ref}>
      {children}
    </div>
  )
);
