import { requireNativeComponent } from 'react-native';
import type { NativeWebViewWindows } from './WebViewTypes';

export const RCTWebView: typeof NativeWebViewWindows =
  requireNativeComponent('RCTWebView');

export const RCTWebView2: typeof NativeWebViewWindows =
  requireNativeComponent('RCTWebView2');
