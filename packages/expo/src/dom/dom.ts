export type DOMProps = Omit<import('react-native-webview').WebViewProps, 'source'>;

export { StyleNoSelect } from './webview-wrapper';

export * from './www-types';

export function isWebview(): boolean {
  return false;
}
