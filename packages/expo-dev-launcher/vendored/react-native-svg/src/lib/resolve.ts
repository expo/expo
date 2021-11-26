import { StyleSheet } from 'react-native';

// Kept in separate file, to avoid name collision with Symbol element
export function resolve<T>(styleProp: Iterable<T>, cleanedProps: T) {
  if (styleProp) {
    return StyleSheet
      ? [styleProp, cleanedProps]
      : // Compatibility for arrays of styles in plain react web
      styleProp[Symbol.iterator]
      ? Object.assign({}, ...styleProp, cleanedProps)
      : Object.assign({}, styleProp, cleanedProps);
  } else {
    return cleanedProps;
  }
}
