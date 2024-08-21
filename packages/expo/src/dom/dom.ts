// Native file

export type DOMProps = Omit<import('react-native-webview').WebViewProps, 'source'>;

// TODO: Maybe this could be a bundler global instead.
/** @returns `true` when the current JS running in a DOM Component environment. */
export const IS_DOM = false;
