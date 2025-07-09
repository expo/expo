import { requireNativeComponent } from 'react-native';
import type { NativeWebViewMacOS } from './WebViewTypes';

const RNCWebView: typeof NativeWebViewMacOS =
  requireNativeComponent('RNCWebView');

export default RNCWebView;
