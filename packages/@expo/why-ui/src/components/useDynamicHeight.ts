import * as React from 'react';

export const useDynamicHeight = (ref, initialHeight = 300) => {
  const [size, setSize] = React.useState({ height: initialHeight, width: 0 });

  React.useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize(entry.contentRect);
      }
    });

    if (ref.current) {
      resizeObserver.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        resizeObserver.unobserve(ref.current);
      }
    };
  }, [ref]);

  return size;
};
