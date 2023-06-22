package abi49_0_0.host.exp.exponent.modules.api.components.webview

import android.app.DownloadManager
import android.content.pm.ActivityInfo
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.DownloadListener
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature
import abi49_0_0.com.facebook.react.bridge.ReadableArray
import abi49_0_0.com.facebook.react.bridge.ReadableMap
import abi49_0_0.com.facebook.react.common.MapBuilder
import abi49_0_0.com.facebook.react.common.build.ReactBuildConfig
import abi49_0_0.com.facebook.react.uimanager.ThemedReactContext
import org.json.JSONException
import org.json.JSONObject
import java.io.UnsupportedEncodingException
import java.net.MalformedURLException
import java.net.URL
import java.util.*

val invalidCharRegex = "[\\\\/%\"]".toRegex()

class RNCWebViewManagerImpl {
    companion object {
        const val NAME = "RNCWebView"
    }

    private val TAG = "RNCWebViewManagerImpl"
    private var mWebViewConfig: RNCWebViewConfig = RNCWebViewConfig { webView: WebView? -> }
    private var mAllowsFullscreenVideo = false
    private var mAllowsProtectedMedia = false
    private var mDownloadingMessage: String? = null
    private var mLackPermissionToDownloadMessage: String? = null

    private var mUserAgent: String? = null
    private var mUserAgentWithApplicationName: String? = null
    private val HTML_ENCODING = "UTF-8"
    private val HTML_MIME_TYPE = "text/html"
    private val HTTP_METHOD_POST = "POST"

    // Use `webView.loadUrl("about:blank")` to reliably reset the view
    // state and release page resources (including any running JavaScript).
    private val BLANK_URL = "about:blank"

    private val DEFAULT_DOWNLOADING_MESSAGE = "Downloading"
    private val DEFAULT_LACK_PERMISSION_TO_DOWNLOAD_MESSAGE =
        "Cannot download files as permission was denied. Please provide permission to write to storage, in order to download files."

    fun createRNCWebViewInstance(context: ThemedReactContext): RNCWebView {
        return RNCWebView(context)
    }

    fun createViewInstance(context: ThemedReactContext): RNCWebView {
      val webView = createRNCWebViewInstance(context)
      return createViewInstance(context, webView);
    }

    fun createViewInstance(context: ThemedReactContext, webView: RNCWebView): RNCWebView {
        setupWebChromeClient(webView)
        context.addLifecycleEventListener(webView)
        mWebViewConfig.configWebView(webView)
        val settings = webView.settings
        settings.builtInZoomControls = true
        settings.displayZoomControls = false
        settings.domStorageEnabled = true
        settings.setSupportMultipleWindows(true)
        settings.allowFileAccess = false
        settings.allowContentAccess = false
        settings.allowFileAccessFromFileURLs = false
        setAllowUniversalAccessFromFileURLs(webView, false)
        setMixedContentMode(webView, "never")

        // Fixes broken full-screen modals/galleries due to body height being 0.
        webView.layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )
        if (ReactBuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true)
        }
        webView.setDownloadListener(DownloadListener { url, userAgent, contentDisposition, mimetype, contentLength ->
            webView.setIgnoreErrFailedForThisURL(url)
            val module = webView.themedReactContext.getNativeModule(RNCWebViewModule::class.java) ?: return@DownloadListener
            val request: DownloadManager.Request = try {
                DownloadManager.Request(Uri.parse(url))
            } catch (e: IllegalArgumentException) {
                Log.w(TAG, "Unsupported URI, aborting download", e)
                return@DownloadListener
            }
            var fileName = URLUtil.guessFileName(url, contentDisposition, mimetype)

            // Sanitize filename by replacing invalid characters with "_"
            fileName = fileName.replace(invalidCharRegex, "_")

            val downloadMessage = "Downloading $fileName"

            //Attempt to add cookie, if it exists
            var urlObj: URL? = null
            try {
                urlObj = URL(url)
                val baseUrl = urlObj.protocol + "://" + urlObj.host
                val cookie = CookieManager.getInstance().getCookie(baseUrl)
                request.addRequestHeader("Cookie", cookie)
            } catch (e: MalformedURLException) {
                Log.w(TAG, "Error getting cookie for DownloadManager", e)
            }

            //Finish setting up request
            request.addRequestHeader("User-Agent", userAgent)
            request.setTitle(fileName)
            request.setDescription(downloadMessage)
            request.allowScanningByMediaScanner()
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
            module.setDownloadRequest(request)
            if (module.grantFileDownloaderPermissions(
                    getDownloadingMessageOrDefault(),
                    getLackPermissionToDownloadMessageOrDefault()
                )
            ) {
                module.downloadFile(
                    getDownloadingMessageOrDefault()
                )
            }
        })
        return webView
    }

    private fun setupWebChromeClient(
        webView: RNCWebView,
    ) {
        val activity = webView.themedReactContext.currentActivity
        if (mAllowsFullscreenVideo && activity != null) {
            val initialRequestedOrientation = activity.requestedOrientation
            val webChromeClient: RNCWebChromeClient =
                object : RNCWebChromeClient(webView) {
                    override fun getDefaultVideoPoster(): Bitmap? {
                        return Bitmap.createBitmap(50, 50, Bitmap.Config.ARGB_8888)
                    }

                    override fun onShowCustomView(view: View, callback: CustomViewCallback) {
                        if (mVideoView != null) {
                            callback.onCustomViewHidden()
                            return
                        }
                        mVideoView = view
                        mCustomViewCallback = callback
                        activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
                        mVideoView.systemUiVisibility = FULLSCREEN_SYSTEM_UI_VISIBILITY
                        activity.window.setFlags(
                            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                        )
                        mVideoView.setBackgroundColor(Color.BLACK)

                        // Since RN's Modals interfere with the View hierarchy
                        // we will decide which View to hide if the hierarchy
                        // does not match (i.e., the WebView is within a Modal)
                        // NOTE: We could use `mWebView.getRootView()` instead of `getRootView()`
                        // but that breaks the Modal's styles and layout, so we need this to render
                        // in the main View hierarchy regardless
                        val rootView = rootView
                        rootView.addView(mVideoView, FULLSCREEN_LAYOUT_PARAMS)

                        // Different root views, we are in a Modal
                        if (rootView.rootView !== mWebView.rootView) {
                            mWebView.rootView.visibility = View.GONE
                        } else {
                            // Same view hierarchy (no Modal), just hide the WebView then
                            mWebView.visibility = View.GONE
                        }
                        mWebView.themedReactContext.addLifecycleEventListener(this)
                    }

                    override fun onHideCustomView() {
                        if (mVideoView == null) {
                            return
                        }

                        // Same logic as above
                        val rootView = rootView
                        if (rootView.rootView !== mWebView.rootView) {
                            mWebView.rootView.visibility = View.VISIBLE
                        } else {
                            // Same view hierarchy (no Modal)
                            mWebView.visibility = View.VISIBLE
                        }
                        activity.window.clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS)
                        rootView.removeView(mVideoView)
                        mCustomViewCallback.onCustomViewHidden()
                        mVideoView = null
                        mCustomViewCallback = null
                        activity.requestedOrientation = initialRequestedOrientation
                        mWebView.themedReactContext.removeLifecycleEventListener(this)
                    }
                }
            webChromeClient.setAllowsProtectedMedia(mAllowsProtectedMedia);
            webView.webChromeClient = webChromeClient
        } else {
            var webChromeClient = webView.webChromeClient as RNCWebChromeClient?
            webChromeClient?.onHideCustomView()
            webChromeClient = object : RNCWebChromeClient(webView) {
                override fun getDefaultVideoPoster(): Bitmap? {
                    return Bitmap.createBitmap(50, 50, Bitmap.Config.ARGB_8888)
                }
            }
            webChromeClient.setAllowsProtectedMedia(mAllowsProtectedMedia);
            webView.webChromeClient = webChromeClient
        }
    }

    fun setUserAgent(view: WebView, userAgent: String?) {
        mUserAgent = userAgent
        setUserAgentString(view)
    }

    fun setApplicationNameForUserAgent(view: WebView, applicationName: String?) {
        when {
            applicationName != null -> {
                val defaultUserAgent = WebSettings.getDefaultUserAgent(view.context)
                mUserAgentWithApplicationName = "$defaultUserAgent $applicationName"
            }
            else -> {
                mUserAgentWithApplicationName = null
            }
        }
        setUserAgentString(view)
    }

    private fun setUserAgentString(view: WebView) {
        when {
            mUserAgent != null -> {
                view.settings.userAgentString = mUserAgent
            }
            mUserAgentWithApplicationName != null -> {
                view.settings.userAgentString = mUserAgentWithApplicationName
            }
            else -> {
                view.settings.userAgentString = WebSettings.getDefaultUserAgent(view.context)
            }
        }
    }

    fun setBasicAuthCredential(view: WebView, credential: ReadableMap?) {
        var basicAuthCredential: RNCBasicAuthCredential? = null
        if (credential != null) {
            if (credential.hasKey("username") && credential.hasKey("password")) {
                val username = credential.getString("username")
                val password = credential.getString("password")
                basicAuthCredential = RNCBasicAuthCredential(username, password)
            }
        }
        (view as RNCWebView).setBasicAuthCredential(basicAuthCredential)
    }

    fun onDropViewInstance(webView: RNCWebView) {
        webView.themedReactContext.removeLifecycleEventListener(webView)
        webView.cleanupCallbacksAndDestroy()
        webView.mWebChromeClient = null
    }

    val COMMAND_GO_BACK = 1
    val COMMAND_GO_FORWARD = 2
    val COMMAND_RELOAD = 3
    val COMMAND_STOP_LOADING = 4
    val COMMAND_POST_MESSAGE = 5
    val COMMAND_INJECT_JAVASCRIPT = 6
    val COMMAND_LOAD_URL = 7
    val COMMAND_FOCUS = 8

    // android commands
    val COMMAND_CLEAR_FORM_DATA = 1000
    val COMMAND_CLEAR_CACHE = 1001
    val COMMAND_CLEAR_HISTORY = 1002

    fun getCommandsMap(): Map<String, Int>? {
      return MapBuilder.builder<String, Int>()
        .put("goBack", COMMAND_GO_BACK)
        .put("goForward", COMMAND_GO_FORWARD)
        .put("reload", COMMAND_RELOAD)
        .put("stopLoading", COMMAND_STOP_LOADING)
        .put("postMessage", COMMAND_POST_MESSAGE)
        .put("injectJavaScript", COMMAND_INJECT_JAVASCRIPT)
        .put("loadUrl", COMMAND_LOAD_URL)
        .put("requestFocus", COMMAND_FOCUS)
        .put("clearFormData", COMMAND_CLEAR_FORM_DATA)
        .put("clearCache", COMMAND_CLEAR_CACHE)
        .put("clearHistory", COMMAND_CLEAR_HISTORY)
        .build()
    }

    fun receiveCommand(webView: RNCWebView, commandId: String, args: ReadableArray) {
      when (commandId) {
        "goBack" -> webView.goBack()
        "goForward" -> webView.goForward()
        "reload" -> webView.reload()
        "stopLoading" -> webView.stopLoading()
        "postMessage" -> try {
          val eventInitDict = JSONObject()
          eventInitDict.put("data", args.getString(0))
          webView.evaluateJavascriptWithFallback(
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
          )
        } catch (e: JSONException) {
          throw RuntimeException(e)
        }
        "injectJavaScript" -> webView.evaluateJavascriptWithFallback(args.getString(0))
        "loadUrl" -> {
          if (args == null) {
            throw RuntimeException("Arguments for loading an url are null!")
          }
          webView.progressChangedFilter.setWaitingForCommandLoadUrl(false)
          webView.loadUrl(args.getString(0))
        }
        "requestFocus" -> webView.requestFocus()
        "clearFormData" -> webView.clearFormData()
        "clearCache" -> {
          val includeDiskFiles = args != null && args.getBoolean(0)
          webView.clearCache(includeDiskFiles)
        }
        "clearHistory" -> webView.clearHistory()
      }
    }

    fun setMixedContentMode(view: WebView, mixedContentMode: String?) {
        if (mixedContentMode == null || "never" == mixedContentMode) {
            view.settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        } else if ("always" == mixedContentMode) {
            view.settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        } else if ("compatibility" == mixedContentMode) {
            view.settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        }
    }

    fun setAllowUniversalAccessFromFileURLs(view: WebView, allow: Boolean) {
        view.settings.allowUniversalAccessFromFileURLs = allow
    }

    private fun getDownloadingMessageOrDefault(): String? {
        return mDownloadingMessage ?: DEFAULT_DOWNLOADING_MESSAGE
    }

    private fun getLackPermissionToDownloadMessageOrDefault(): String? {
        return mLackPermissionToDownloadMessage
            ?: DEFAULT_LACK_PERMISSION_TO_DOWNLOAD_MESSAGE
    }

    fun setSource(view: RNCWebView, source: ReadableMap?, newArch: Boolean = true) {
        if (source != null) {
            if (source.hasKey("html")) {
                val html = source.getString("html")
                val baseUrl = if (source.hasKey("baseUrl")) source.getString("baseUrl") else ""
                view.loadDataWithBaseURL(
                    baseUrl,
                    html!!,
                    HTML_MIME_TYPE,
                    HTML_ENCODING,
                    null
                )
                return
            }
            if (source.hasKey("uri")) {
                val url = source.getString("uri")
                val previousUrl = view.url
                if (previousUrl != null && previousUrl == url) {
                    return
                }
                if (source.hasKey("method")) {
                    val method = source.getString("method")
                    if (method.equals(HTTP_METHOD_POST, ignoreCase = true)) {
                        var postData: ByteArray? = null
                        if (source.hasKey("body")) {
                            val body = source.getString("body")
                            postData = try {
                                body!!.toByteArray(charset("UTF-8"))
                            } catch (e: UnsupportedEncodingException) {
                                body!!.toByteArray()
                            }
                        }
                        if (postData == null) {
                            postData = ByteArray(0)
                        }
                        view.postUrl(url!!, postData)
                        return
                    }
                }
                val headerMap = HashMap<String, String?>()
                if (source.hasKey("headers")) {
                    if (newArch) {
                      val headerArray = source.getArray("headers");
                      for (header in headerArray!!.toArrayList()) {
                        val headerCasted = header as HashMap<String, String>
                        val name = headerCasted.get("name") ?: ""
                        val value = headerCasted.get("value") ?: ""
                        if ("user-agent" == name.lowercase(Locale.ENGLISH)) {
                          view.settings.userAgentString = value
                        } else {
                          headerMap[name] = value
                        }
                      }
                    } else {
                      val headers = source.getMap("headers")
                      val iter = headers!!.keySetIterator()
                      while (iter.hasNextKey()) {
                        val key = iter.nextKey()
                        if ("user-agent" == key.lowercase(Locale.ENGLISH)) {
                          view.settings.userAgentString = headers.getString(key)
                        } else {
                          headerMap[key] = headers.getString(key)
                        }
                      }
                    }
                }
                view.loadUrl(url!!, headerMap)
                return
            }
        }
        view.loadUrl(BLANK_URL)
    }

    fun setMessagingModuleName(view: RNCWebView, value: String?) {
        view.messagingModuleName = value
    }

    fun setCacheEnabled(view: RNCWebView, enabled: Boolean) {
      view.settings.cacheMode = if (enabled) WebSettings.LOAD_DEFAULT else WebSettings.LOAD_NO_CACHE
    }

    fun setIncognito(view: RNCWebView, enabled: Boolean) {
        // Don't do anything when incognito is disabled
        if (!enabled) {
            return;
        }

        // Remove all previous cookies
        CookieManager.getInstance().removeAllCookies(null);

        // Disable caching
        view.settings.cacheMode = WebSettings.LOAD_NO_CACHE
        view.clearHistory();
        view.clearCache(true);

        // No form data or autofill enabled
        view.clearFormData();
        view.settings.savePassword = false;
        view.settings.saveFormData = false;
    }

    fun setInjectedJavaScript(view: RNCWebView, injectedJavaScript: String?) {
        view.injectedJS = injectedJavaScript
    }

    fun setInjectedJavaScriptBeforeContentLoaded(view: RNCWebView, value: String?) {
        view.injectedJSBeforeContentLoaded = value
    }

    fun setInjectedJavaScriptForMainFrameOnly(view: RNCWebView, value: Boolean) {
        view.injectedJavaScriptForMainFrameOnly = value
    }

    fun setInjectedJavaScriptBeforeContentLoadedForMainFrameOnly(view: RNCWebView, value: Boolean) {
        view.injectedJavaScriptBeforeContentLoadedForMainFrameOnly = value
    }

    fun setJavaScriptCanOpenWindowsAutomatically(view: RNCWebView, value: Boolean) {
        view.settings.javaScriptCanOpenWindowsAutomatically = value
    }

    fun setShowsVerticalScrollIndicator(view: RNCWebView, value: Boolean) {
        view.isVerticalScrollBarEnabled = value
    }

    fun setShowsHorizontalScrollIndicator(view: RNCWebView, value: Boolean) {
        view.isHorizontalScrollBarEnabled = value
    }

    fun setMessagingEnabled(view: RNCWebView, value: Boolean) {
        view.setMessagingEnabled(value)
    }

    fun setMediaPlaybackRequiresUserAction(view: RNCWebView, value: Boolean) {
        view.settings.mediaPlaybackRequiresUserGesture = value
    }

    fun setHasOnScroll(view: RNCWebView, value: Boolean) {
        view.setHasScrollEvent(value)
    }

    fun setJavaScriptEnabled(view: RNCWebView, enabled: Boolean) {
        view.settings.javaScriptEnabled = enabled
    }

    fun setAllowFileAccess(view: RNCWebView, allowFileAccess: Boolean) {
        view.settings.allowFileAccess = allowFileAccess;
    }

    fun setAllowFileAccessFromFileURLs(view: RNCWebView, value: Boolean) {
        view.settings.allowFileAccessFromFileURLs = value;
    }

    fun setAllowsFullscreenVideo(view: RNCWebView, value: Boolean) {
        mAllowsFullscreenVideo = value
        setupWebChromeClient(view)
    }

    fun setAndroidLayerType(view: RNCWebView, layerTypeString: String?) {
        val layerType = when (layerTypeString) {
            "hardware" -> View.LAYER_TYPE_HARDWARE
            "software" -> View.LAYER_TYPE_SOFTWARE
            else -> View.LAYER_TYPE_NONE
        }
        view.setLayerType(layerType, null)
    }

    fun setCacheMode(view: RNCWebView, cacheModeString: String?) {
        view.settings.cacheMode = when (cacheModeString) {
            "LOAD_CACHE_ONLY" -> WebSettings.LOAD_CACHE_ONLY
            "LOAD_CACHE_ELSE_NETWORK" -> WebSettings.LOAD_CACHE_ELSE_NETWORK
            "LOAD_NO_CACHE" -> WebSettings.LOAD_NO_CACHE
            "LOAD_DEFAULT" -> WebSettings.LOAD_DEFAULT
            else -> WebSettings.LOAD_DEFAULT
        }
    }

    fun setDomStorageEnabled(view: RNCWebView, value: Boolean) {
        view.settings.domStorageEnabled = value
    }

    fun setDownloadingMessage(value: String?) {
        mDownloadingMessage = value
    }

    fun setForceDarkOn(view: RNCWebView, enabled: Boolean) {
        // Only Android 10+ support dark mode
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.P) {
            if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
                val forceDarkMode =
                    if (enabled) WebSettingsCompat.FORCE_DARK_ON else WebSettingsCompat.FORCE_DARK_OFF
                WebSettingsCompat.setForceDark(view.settings, forceDarkMode)
            }

            // Set how WebView content should be darkened.
            // PREFER_WEB_THEME_OVER_USER_AGENT_DARKENING:  checks for the "color-scheme" <meta> tag.
            // If present, it uses media queries. If absent, it applies user-agent (automatic)
            // More information about Force Dark Strategy can be found here:
            // https://developer.android.com/reference/androidx/webkit/WebSettingsCompat#setForceDarkStrategy(android.webkit.WebSettings)
            if (enabled && WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK_STRATEGY)) {
                WebSettingsCompat.setForceDarkStrategy(
                    view.settings,
                    WebSettingsCompat.DARK_STRATEGY_PREFER_WEB_THEME_OVER_USER_AGENT_DARKENING
                )
            }
        }
    }

    fun setGeolocationEnabled(view: RNCWebView, value: Boolean) {
        view.settings.setGeolocationEnabled(value)
    }

    fun setLackPermissionToDownloadMessage(value: String?) {
        mLackPermissionToDownloadMessage = value
    }

    fun setMinimumFontSize(view: RNCWebView, value: Int) {
        view.settings.minimumFontSize = value
    }

    fun setAllowsProtectedMedia(view: RNCWebView, enabled: Boolean) {
      // This variable is used to keep consistency
      // in case a new WebChromeClient is created
      // (eg. when mAllowsFullScreenVideo changes)
      mAllowsProtectedMedia = enabled
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val client = view.webChromeClient
        if (client != null && client is RNCWebChromeClient) {
          client.setAllowsProtectedMedia(enabled)
        }
      }
    }

    fun setMenuCustomItems(view: RNCWebView, value: ReadableArray) {
        view.setMenuCustomItems(value.toArrayList() as List<Map<String, String>>)
    }

    fun setNestedScrollEnabled(view: RNCWebView, value: Boolean) {
        view.nestedScrollEnabled = value
    }

    fun setOverScrollMode(view: RNCWebView, overScrollModeString: String?) {
        view.overScrollMode = when (overScrollModeString) {
            "never" -> View.OVER_SCROLL_NEVER
            "content" -> View.OVER_SCROLL_IF_CONTENT_SCROLLS
            "always" -> View.OVER_SCROLL_ALWAYS
            else -> View.OVER_SCROLL_ALWAYS
        }
    }

    fun setSaveFormDataDisabled(view: RNCWebView, disabled: Boolean) {
        view.settings.saveFormData = !disabled
    }

    fun setScalesPageToFit(view: RNCWebView, value: Boolean) {
        view.settings.loadWithOverviewMode = value
        view.settings.useWideViewPort = value
    }

    fun setSetBuiltInZoomControls(view: RNCWebView, value: Boolean) {
        view.settings.builtInZoomControls = value
    }

    fun setSetDisplayZoomControls(view: RNCWebView, value: Boolean) {
        view.settings.displayZoomControls = value

    }

    fun setSetSupportMultipleWindows(view: RNCWebView, value: Boolean) {
        view.settings.setSupportMultipleWindows(value)
    }

    fun setTextZoom(view: RNCWebView, value: Int) {
        view.settings.textZoom = value
    }

    fun setThirdPartyCookiesEnabled(view: RNCWebView, enabled: Boolean) {
        CookieManager.getInstance().setAcceptThirdPartyCookies(view, enabled)
    }

    fun setWebviewDebuggingEnabled(view: RNCWebView, enabled: Boolean) {
        RNCWebView.setWebContentsDebuggingEnabled(enabled)
    }
}