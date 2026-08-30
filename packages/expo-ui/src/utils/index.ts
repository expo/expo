import * as React from 'react';
import { StyleSheet, View } from 'react-native';

export const hostedContent = (children: React.ReactNode): React.ReactNode => {
  const elements = flattenFragments(children);

  if (elements.length === 0) {
    return children;
  }

  if (elements.length === 1 && React.isValidElement(elements[0])) {
    return elements[0];
  }

  return React.createElement(
    View,
    // `flex: 1` so the wrapper fills the host the way the elements did on their own, and
    // `collapsable: false` so it is never flattened away and they land on the host again.
    // Mirrors how React Native's `Modal` wraps the content it hands to its own host view.
    { style: styles.hostedContent, collapsable: false },
    children
  );
};

const styles = StyleSheet.create({
  hostedContent: { flex: 1 },
});

const flattenFragments = (children: React.ReactNode): React.ReactNode[] =>
  React.Children.toArray(children).flatMap((child) =>
    React.isValidElement(child) && child.type === React.Fragment
      ? flattenFragments((child.props as { children?: React.ReactNode }).children)
      : [child]
  );

export const getTextFromChildren = (children: React.ReactNode): string | undefined => {
  if (typeof children === 'string') {
    return children;
  }
  if (typeof children === 'number') {
    return children.toString();
  }
  if (Array.isArray(children)) {
    const text = children.map(getTextFromChildren).filter(Boolean).join('');
    return text || undefined;
  }
  return undefined;
};
