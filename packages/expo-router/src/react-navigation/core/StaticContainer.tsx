import * as React from 'react';

/**
 * Component which prevents updates for children if no props changed
 */
export const StaticContainer = React.memo(
  function StaticContainer(props: any) {
    return props.children;
  },
  (prevProps: any, nextProps: any) => {
    const prevPropKeys = Object.keys(prevProps);
    const nextPropKeys = Object.keys(nextProps);

    if (prevPropKeys.length !== nextPropKeys.length) {
      return false;
    }

    for (const key of prevPropKeys) {
      if (key === 'children') {
        continue;
      }

      if (prevProps[key] !== nextProps[key]) {
        return false;
      }
    }

    return true;
  }
);
