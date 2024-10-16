package com.reactnativecommunity.webview;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.viewmanagers.RNCWebViewManagerDelegate;
import com.facebook.react.viewmanagers.RNCWebViewManagerInterface;
import com.facebook.react.views.scroll.ScrollEventType;
import com.reactnativecommunity.webview.events.TopCustomMenuSelectionEvent;
import com.reactnativecommunity.webview.events.TopHttpErrorEvent;
import com.reactnativecommunity.webview.events.TopLoadingErrorEvent;
import com.reactnativecommunity.webview.events.TopLoadingFinishEvent;
import com.reactnativecommunity.webview.events.TopLoadingProgressEvent;
import com.reactnativecommunity.webview.events.TopLoadingStartEvent;
import com.reactnativecommunity.webview.events.TopMessageEvent;
import com.reactnativecommunity.webview.events.TopOpenWindowEvent;
import com.reactnativecommunity.webview.events.TopRenderProcessGoneEvent;
import com.reactnativecommunity.webview.events.TopShouldStartLoadWithRequestEvent;

import android.webkit.WebChromeClient;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Map;

@ReactModule(name = RNCWebViewManagerImpl.NAME)
public class RNCWebViewManager extends ViewGroupManager<RNCWebViewWrapper>
        implements RNCWebViewManagerInterface<RNCWebViewWrapper> {

    private final ViewManagerDelegate<RNCWebViewWrapper> mDelegate;
    private final RNCWebViewManagerImpl mRNCWebViewManagerImpl;

    public RNCWebViewManager() {
        mDelegate = new RNCWebViewManagerDelegate<>(this);
        mRNCWebViewManagerImpl = new RNCWebViewManagerImpl();
    }

    @Nullable
    @Override
    protected ViewManagerDelegate<RNCWebViewWrapper> getDelegate() {
        return mDelegate;
    }

    @NonNull
    @Override
    public String getName() {
        return RNCWebViewManagerImpl.NAME;
    }

    @NonNull
    @Override
    protected RNCWebViewWrapper createViewInstance(@NonNull ThemedReactContext context) {
        return mRNCWebViewManagerImpl.createViewInstance(context);
    }

    @Override
    @ReactProp(name = "allowFileAccess")
    public void setAllowFileAccess(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setAllowFileAccess(view, value);
    }

    @Override
    @ReactProp(name = "allowFileAccessFromFileURLs")
    public void setAllowFileAccessFromFileURLs(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setAllowFileAccessFromFileURLs(view, value);

    }

    @Override
    @ReactProp(name = "allowUniversalAccessFromFileURLs")
    public void setAllowUniversalAccessFromFileURLs(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setAllowUniversalAccessFromFileURLs(view, value);
    }

    @Override
    @ReactProp(name = "allowsFullscreenVideo")
    public void setAllowsFullscreenVideo(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setAllowsFullscreenVideo(view, value);
    }

    @Override
    @ReactProp(name = "allowsProtectedMedia")
    public void setAllowsProtectedMedia(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setAllowsProtectedMedia(view, value);
    }

    @Override
    @ReactProp(name = "androidLayerType")
    public void setAndroidLayerType(RNCWebViewWrapper view, @Nullable String value) {
        mRNCWebViewManagerImpl.setAndroidLayerType(view, value);
    }

    @Override
    @ReactProp(name = "applicationNameForUserAgent")
    public void setApplicationNameForUserAgent(RNCWebViewWrapper view, @Nullable String value) {
        mRNCWebViewManagerImpl.setApplicationNameForUserAgent(view, value);
    }

    @Override
    @ReactProp(name = "basicAuthCredential")
    public void setBasicAuthCredential(RNCWebViewWrapper view, @Nullable ReadableMap value) {
        mRNCWebViewManagerImpl.setBasicAuthCredential(view, value);
    }

    @Override
    @ReactProp(name = "cacheEnabled")
    public void setCacheEnabled(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setCacheEnabled(view, value);
    }

    @Override
    @ReactProp(name = "cacheMode")
    public void setCacheMode(RNCWebViewWrapper view, @Nullable String value) {
        mRNCWebViewManagerImpl.setCacheMode(view, value);
    }

    @Override
    @ReactProp(name = "domStorageEnabled")
    public void setDomStorageEnabled(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setDomStorageEnabled(view, value);
    }

    @Override
    @ReactProp(name = "downloadingMessage")
    public void setDownloadingMessage(RNCWebViewWrapper view, @Nullable String value) {
        mRNCWebViewManagerImpl.setDownloadingMessage(value);
    }

    @Override
    @ReactProp(name = "forceDarkOn")
    public void setForceDarkOn(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setForceDarkOn(view, value);
    }

    @Override
    @ReactProp(name = "geolocationEnabled")
    public void setGeolocationEnabled(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setGeolocationEnabled(view, value);
    }

    @Override
    @ReactProp(name = "hasOnScroll")
    public void setHasOnScroll(RNCWebViewWrapper view, boolean hasScrollEvent) {
        mRNCWebViewManagerImpl.setHasOnScroll(view, hasScrollEvent);
    }

    @Override
    @ReactProp(name = "incognito")
    public void setIncognito(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setIncognito(view, value);
    }

    @Override
    @ReactProp(name = "injectedJavaScript")
    public void setInjectedJavaScript(RNCWebViewWrapper view, @Nullable String value) {
        mRNCWebViewManagerImpl.setInjectedJavaScript(view, value);
    }

    @Override
    @ReactProp(name = "injectedJavaScriptBeforeContentLoaded")
    public void setInjectedJavaScriptBeforeContentLoaded(RNCWebViewWrapper view, @Nullable String value) {
        mRNCWebViewManagerImpl.setInjectedJavaScriptBeforeContentLoaded(view, value);
    }

    @Override
    @ReactProp(name = "injectedJavaScriptForMainFrameOnly")
    public void setInjectedJavaScriptForMainFrameOnly(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setInjectedJavaScriptForMainFrameOnly(view, value);

    }

    @Override
    @ReactProp(name = "injectedJavaScriptBeforeContentLoadedForMainFrameOnly")
    public void setInjectedJavaScriptBeforeContentLoadedForMainFrameOnly(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setInjectedJavaScriptBeforeContentLoadedForMainFrameOnly(view, value);

    }

    @ReactProp(name = "injectedJavaScriptObject")
    public void setInjectedJavaScriptObject(RNCWebViewWrapper view, @Nullable String value) {
        mRNCWebViewManagerImpl.setInjectedJavaScriptObject(view, value);
    }

    @Override
    @ReactProp(name = "javaScriptCanOpenWindowsAutomatically")
    public void setJavaScriptCanOpenWindowsAutomatically(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setJavaScriptCanOpenWindowsAutomatically(view, value);
    }

    @ReactProp(name = "javaScriptEnabled")
    public void setJavaScriptEnabled(RNCWebViewWrapper view, boolean enabled) {
        mRNCWebViewManagerImpl.setJavaScriptEnabled(view, enabled);
    }

    @Override
    @ReactProp(name = "lackPermissionToDownloadMessage")
    public void setLackPermissionToDownloadMessage(RNCWebViewWrapper view, @Nullable String value) {
        mRNCWebViewManagerImpl.setLackPermissionToDownloadMessage(value);
    }

    @Override
    @ReactProp(name = "hasOnOpenWindowEvent")
    public void setHasOnOpenWindowEvent(RNCWebViewWrapper view, boolean hasEvent) {
        mRNCWebViewManagerImpl.setHasOnOpenWindowEvent(view, hasEvent);
    }

    @Override
    @ReactProp(name = "mediaPlaybackRequiresUserAction")
    public void setMediaPlaybackRequiresUserAction(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setMediaPlaybackRequiresUserAction(view, value);
    }

    @Override
    @ReactProp(name = "menuItems")
    public void setMenuItems(RNCWebViewWrapper view, @Nullable ReadableArray items) {
        mRNCWebViewManagerImpl.setMenuCustomItems(view, items);
    }

    @Override
    @ReactProp(name = "suppressMenuItems ")
    public void setSuppressMenuItems(RNCWebViewWrapper view, @Nullable ReadableArray items) {}

    @Override
    @ReactProp(name = "messagingEnabled")
    public void setMessagingEnabled(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setMessagingEnabled(view, value);
    }

    @Override
    @ReactProp(name = "messagingModuleName")
    public void setMessagingModuleName(RNCWebViewWrapper view, @Nullable String value) {
        mRNCWebViewManagerImpl.setMessagingModuleName(view, value);
    }

    @Override
    @ReactProp(name = "minimumFontSize")
    public void setMinimumFontSize(RNCWebViewWrapper view, int value) {
        mRNCWebViewManagerImpl.setMinimumFontSize(view, value);
    }

    @Override
    @ReactProp(name = "mixedContentMode")
    public void setMixedContentMode(RNCWebViewWrapper view, @Nullable String value) {
        mRNCWebViewManagerImpl.setMixedContentMode(view, value);
    }

    @Override
    @ReactProp(name = "nestedScrollEnabled")
    public void setNestedScrollEnabled(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setNestedScrollEnabled(view, value);
    }

    @Override
    @ReactProp(name = "overScrollMode")
    public void setOverScrollMode(RNCWebViewWrapper view, @Nullable String value) {
        mRNCWebViewManagerImpl.setOverScrollMode(view, value);
    }

    @Override
    @ReactProp(name = "saveFormDataDisabled")
    public void setSaveFormDataDisabled(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setSaveFormDataDisabled(view, value);
    }

    @Override
    @ReactProp(name = "scalesPageToFit")
    public void setScalesPageToFit(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setScalesPageToFit(view, value);
    }

    @Override
    @ReactProp(name = "setBuiltInZoomControls")
    public void setSetBuiltInZoomControls(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setSetBuiltInZoomControls(view, value);
    }

    @Override
    @ReactProp(name = "setDisplayZoomControls")
    public void setSetDisplayZoomControls(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setSetDisplayZoomControls(view, value);
    }

    @Override
    @ReactProp(name = "setSupportMultipleWindows")
    public void setSetSupportMultipleWindows(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setSetSupportMultipleWindows(view, value);
    }

    @Override
    @ReactProp(name = "showsHorizontalScrollIndicator")
    public void setShowsHorizontalScrollIndicator(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setShowsHorizontalScrollIndicator(view, value);
    }

    @Override
    @ReactProp(name = "showsVerticalScrollIndicator")
    public void setShowsVerticalScrollIndicator(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setShowsVerticalScrollIndicator(view, value);
    }

    @Override
    @ReactProp(name = "newSource")
    public void setNewSource(RNCWebViewWrapper view, @Nullable ReadableMap value) {
        mRNCWebViewManagerImpl.setSource(view, value, true);
    }

    @Override
    @ReactProp(name = "textZoom")
    public void setTextZoom(RNCWebViewWrapper view, int value) {
        mRNCWebViewManagerImpl.setTextZoom(view, value);
    }

    @Override
    @ReactProp(name = "thirdPartyCookiesEnabled")
    public void setThirdPartyCookiesEnabled(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setThirdPartyCookiesEnabled(view, value);
    }

    @Override
    @ReactProp(name = "webviewDebuggingEnabled")
    public void setWebviewDebuggingEnabled(RNCWebViewWrapper view, boolean value) {
        mRNCWebViewManagerImpl.setWebviewDebuggingEnabled(view, value);
    }

    /* iOS PROPS - no implemented here */
    @Override
    public void setAllowingReadAccessToURL(RNCWebViewWrapper view, @Nullable String value) {}

    @Override
    public void setAllowsBackForwardNavigationGestures(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setAllowsInlineMediaPlayback(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setAllowsPictureInPictureMediaPlayback(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setAllowsAirPlayForMediaPlayback(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setAllowsLinkPreview(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setAutomaticallyAdjustContentInsets(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setAutoManageStatusBarEnabled(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setBounces(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setContentInset(RNCWebViewWrapper view, @Nullable ReadableMap value) {}

    @Override
    public void setContentInsetAdjustmentBehavior(RNCWebViewWrapper view, @Nullable String value) {}

    @Override
    public void setContentMode(RNCWebViewWrapper view, @Nullable String value) {}

    @Override
    public void setDataDetectorTypes(RNCWebViewWrapper view, @Nullable ReadableArray value) {}

    @Override
    public void setDecelerationRate(RNCWebViewWrapper view, double value) {}

    @Override
    public void setDirectionalLockEnabled(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setEnableApplePay(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setHideKeyboardAccessoryView(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setKeyboardDisplayRequiresUserAction(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setPagingEnabled(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setPullToRefreshEnabled(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setRefreshControlLightMode(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setScrollEnabled(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setSharedCookiesEnabled(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setUseSharedProcessPool(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setLimitsNavigationsToAppBoundDomains(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setTextInteractionEnabled(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setHasOnFileDownload(RNCWebViewWrapper view, boolean value) {}

    @Override
    public void setMediaCapturePermissionGrantType(RNCWebViewWrapper view, @Nullable String value) {}

    @Override
    public void setFraudulentWebsiteWarningEnabled(RNCWebViewWrapper view, boolean value) {}
    /* !iOS PROPS - no implemented here */

    @Override
    @ReactProp(name = "userAgent")
    public void setUserAgent(RNCWebViewWrapper view, @Nullable String value) {
        mRNCWebViewManagerImpl.setUserAgent(view, value);
    }

  @Override
  public void goBack(RNCWebViewWrapper view) {
    view.getWebView().goBack();
  }

  @Override
  public void goForward(RNCWebViewWrapper view) {
    view.getWebView().goForward();
  }

  @Override
  public void reload(RNCWebViewWrapper view) {
    view.getWebView().reload();
  }

  @Override
  public void stopLoading(RNCWebViewWrapper view) {
    view.getWebView().stopLoading();
  }

  @Override
  public void injectJavaScript(RNCWebViewWrapper view, String javascript) {
      view.getWebView().evaluateJavascriptWithFallback(javascript);
  }

  @Override
  public void requestFocus(RNCWebViewWrapper view) {
      view.requestFocus();
  }

  @Override
  public void postMessage(RNCWebViewWrapper view, String data) {
      try {
        JSONObject eventInitDict = new JSONObject();
        eventInitDict.put("data", data);
        view.getWebView().evaluateJavascriptWithFallback(
          "(function () {" +
            "var event;" +
            "var data = " + eventInitDict.toString() + ";" +
            "try {" +
            "event = new MessageEvent('message', data);" +
            "} catch (e) {" +
            "event = document.createEvent('MessageEvent');" +
            "event.initMessageEvent('message', true, true, data.data, data.origin, data.lastEventId, data.source);" +
            "}" +
            "document.dispatchEvent(event);" +
            "})();"
        );
      } catch (JSONException e) {
        throw  new RuntimeException(e);
      }
  }

  @Override
  public void loadUrl(RNCWebViewWrapper view, String url) {
      view.getWebView().loadUrl(url);
  }

  @Override
  public void clearFormData(RNCWebViewWrapper view) {
      view.getWebView().clearFormData();
  }

  @Override
  public void clearCache(RNCWebViewWrapper view, boolean includeDiskFiles) {
      view.getWebView().clearCache(includeDiskFiles);
  }

  @Override
  public void clearHistory(RNCWebViewWrapper view) {
      view.getWebView().clearHistory();
  }

  @Override
    protected void addEventEmitters(@NonNull ThemedReactContext reactContext, RNCWebViewWrapper view) {
        // Do not register default touch emitter and let WebView implementation handle touches
        view.getWebView().setWebViewClient(new RNCWebViewClient());
    }

    @Override
    public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        Map<String, Object> export = super.getExportedCustomDirectEventTypeConstants();
        if (export == null) {
            export = MapBuilder.newHashMap();
        }
        // Default events but adding them here explicitly for clarity
        export.put(TopLoadingStartEvent.EVENT_NAME, MapBuilder.of("registrationName", "onLoadingStart"));
        export.put(TopLoadingFinishEvent.EVENT_NAME, MapBuilder.of("registrationName", "onLoadingFinish"));
        export.put(TopLoadingErrorEvent.EVENT_NAME, MapBuilder.of("registrationName", "onLoadingError"));
        export.put(TopMessageEvent.EVENT_NAME, MapBuilder.of("registrationName", "onMessage"));
        // !Default events but adding them here explicitly for clarity

        export.put(TopLoadingProgressEvent.EVENT_NAME, MapBuilder.of("registrationName", "onLoadingProgress"));
        export.put(TopShouldStartLoadWithRequestEvent.EVENT_NAME, MapBuilder.of("registrationName", "onShouldStartLoadWithRequest"));
        export.put(ScrollEventType.getJSEventName(ScrollEventType.SCROLL), MapBuilder.of("registrationName", "onScroll"));
        export.put(TopHttpErrorEvent.EVENT_NAME, MapBuilder.of("registrationName", "onHttpError"));
        export.put(TopRenderProcessGoneEvent.EVENT_NAME, MapBuilder.of("registrationName", "onRenderProcessGone"));
        export.put(TopCustomMenuSelectionEvent.EVENT_NAME, MapBuilder.of("registrationName", "onCustomMenuSelection"));
        export.put(TopOpenWindowEvent.EVENT_NAME, MapBuilder.of("registrationName", "onOpenWindow"));
        return export;
    }

    @Override
    public @Nullable
    Map<String, Integer> getCommandsMap() {
        return mRNCWebViewManagerImpl.getCommandsMap();
    }

    @Override
    public void receiveCommand(@NonNull RNCWebViewWrapper reactWebView, String commandId, @Nullable ReadableArray args) {
        super.receiveCommand(reactWebView, commandId, args);
    }

    @Override
    public void onDropViewInstance(@NonNull RNCWebViewWrapper view) {
        mRNCWebViewManagerImpl.onDropViewInstance(view);
        super.onDropViewInstance(view);
    }
}