package abi49_0_0.host.exp.exponent.modules.api.components.webview;

import android.webkit.WebView;

/**
 * Implement this interface in order to config your {@link WebView}. An instance of that
 * implementation will have to be given as a constructor argument to {@link RNCWebViewManager}.
 */
public interface RNCWebViewConfig {
    void configWebView(WebView webView);
}