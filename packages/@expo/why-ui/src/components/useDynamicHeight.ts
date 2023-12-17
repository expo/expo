import * as React from 'react';

export const useDynamicHeight = (ref, initialHeight = 300) => {
  const [height, setHeight] = React.useState(initialHeight);

  React.useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setHeight(entry.contentRect.height);
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

  return height;
};
