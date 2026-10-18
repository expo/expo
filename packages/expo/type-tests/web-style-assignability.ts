/// <reference path="../types/react-native-web.d.ts" />

import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

// TextStyle must be assignable to ViewStyle. `cursor` is the mismatch.
const textStyle: TextStyle = { color: 'red' };
export const viewFromText: ViewStyle = textStyle;

// A view style must be assignable to TextStyle. `transitionDuration` is the mismatch.
const viewStyle: ViewStyle = { opacity: 1 };
export const textFromView: TextStyle = viewStyle;

// A view style must be passable to StyleSheet.flatten. `userSelect` is the mismatch.
export const flattenedView = StyleSheet.flatten(viewStyle);
export const flattenedText = StyleSheet.flatten(textStyle);

// Web values that stay valid: wide cursors, RN-web userSelect keywords, and numeric durations.
export const grabText: TextStyle = { cursor: 'grab' };
export const grabView: ViewStyle = { cursor: 'grab' };
export const cursorUrl: TextStyle = { cursor: 'url(cursor.png) 4 12, auto' };
export const durationNumber: ViewStyle = { transitionDuration: 300 };
export const durationString: ViewStyle = { transitionDuration: '300ms' };
export const durationTextNumber: TextStyle = { transitionDuration: 200 };
export const durationTextString: TextStyle = { transitionDuration: '200ms' };
export const userSelects: ViewStyle[] = (['auto', 'text', 'none', 'contain', 'all'] as const).map(
  (userSelect) => ({ userSelect })
);

export const invalidUserSelect: ViewStyle = {
  // @ts-expect-error userSelect only accepts the keywords React Native and react-native-web accept.
  userSelect: 'bogus',
};
