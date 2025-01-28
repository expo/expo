package com.reactnativecommunity.webview;

import android.webkit.WebView;

/**
 * Implement this interface in order to config your {@link WebView}. An instance of that
 * implementation will have to be given as a constructor argument to {@link RNCWebViewManager}.
 */
public interface RNCWebViewConfig {
    void configWebView(WebView webView);
}