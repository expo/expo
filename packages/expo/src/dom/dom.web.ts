export * from './dom-hooks';

// TODO: Maybe this could be a bundler global instead.
export const IS_DOM =
  // @ts-expect-error: Added via react-native-webview
  typeof $$EXPO_INITIAL_PROPS !== 'undefined';
