import * as React from 'react';

/**
 * Like `React.Children.toArray`, but also flattens `React.Fragment` children so
 * their contents are treated as direct children. Keys of nested elements are
 * prefixed with the fragment's key to stay unique.
 */
export function flattenFragments(children: React.ReactNode): React.ReactNode[] {
  return React.Children.toArray(children).flatMap((child) => {
    if (
      React.isValidElement<{ children?: React.ReactNode }>(child) &&
      child.type === React.Fragment
    ) {
      return flattenFragments(child.props.children).map((nested) =>
        React.isValidElement(nested)
          ? React.cloneElement(nested, { key: `${child.key}${nested.key}` })
          : nested
      );
    }
    return child;
  });
}
