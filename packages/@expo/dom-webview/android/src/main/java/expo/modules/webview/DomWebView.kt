// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.webview

import android.animation.ObjectAnimator
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.view.MotionEvent
import android.view.View
import android.view.View.OnTouchListener
import android.view.ViewGroup
import android.webkit.WebView
import android.webkit.WebViewClient
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

@SuppressLint("ViewConstructor")
internal class DomWebView(context: Context, appContext: AppContext) : ExpoView(context, appContext), OnTouchListener {
  val webView: WebView
  val webViewId = DomWebViewRegistry.add(this)

  private var source: DomWebViewSource? = null
  private var injectedJSBeforeContentLoaded: String? = null
  var webviewDebuggingEnabled = false
  var nestedScrollEnabled = true

  private var needsResetupScripts = false

  private val onMessage by EventDispatcher<OnMessageEvent>()

  init {
    this.webView = createWebView()
    addView(
      webView,
      ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
    )
  }

  // region Public methods

  fun reload() {
    WebView.setWebContentsDebuggingEnabled(webviewDebuggingEnabled)

    source?.uri?.let {
      if (it != webView.url) {
        webView.loadUrl(it)
      }
      return
    }

    if (needsResetupScripts) {
      needsResetupScripts = false
      webView.reload()
    }
  }

  fun setSource(source: DomWebViewSource) {
    this.source = source
  }

  fun setInjectedJSBeforeContentLoaded(script: String?) {
    injectedJSBeforeContentLoaded = if (!script.isNullOrEmpty()) {
      "(function() { $script; })();true;"
    } else {
      null
    }
    needsResetupScripts = true
  }

  fun injectJavaScript(script: String) {
    webView.post {
      webView.evaluateJavascript(script, null)
    }
  }

  fun dispatchMessageEvent(message: String) {
    webView.post {
      val messageEvent = OnMessageEvent(
        title = webView.title ?: "",
        url = webView.url ?: "",
        data = message
      )
      onMessage.invoke(messageEvent)
    }
  }

  fun evalSync(data: String): String {
    val json = JSONObject(data)
    val deferredId = json.getInt("deferredId")
    val source = json.getString("source")
    return runBlocking {
      nativeJsiEvalSync(deferredId, source)
    }
  }

  fun scrollTo(param: ScrollToParam) {
    webView.post {
      if (!param.animated) {
        webView.scrollTo(param.x.toInt(), param.y.toInt())
        return@post
      }

      val duration = 250L
      val animatorX = ObjectAnimator.ofInt(webView, "scrollX", webView.scrollX, param.x.toInt())
      animatorX.setDuration(duration)
      val animatorY = ObjectAnimator.ofInt(webView, "scrollY", webView.scrollY, param.y.toInt())
      animatorY.setDuration(duration)
      animatorX.start()
      animatorY.start()
    }
  }

  // endregion Public methods

  // region Override methods

  override fun onTouch(view: View?, event: MotionEvent?): Boolean {
    if (nestedScrollEnabled) {
      requestDisallowInterceptTouchEvent(true)
    }
    return false
  }

  // region Override methods

  // region Internals

  @SuppressLint("SetJavaScriptEnabled")
  private fun createWebView(): WebView {
    return WebView(context).apply {
      setBackgroundColor(Color.TRANSPARENT)
      settings.javaScriptEnabled = true
      webViewClient = createWebViewClient()
      addJavascriptInterface(RNCWebViewBridge(this@DomWebView), "ReactNativeWebView")
      addJavascriptInterface(DomWebViewBridge(this@DomWebView), "ExpoDomWebViewBridge")
      setOnTouchListener(this@DomWebView)
    }
  }

  private fun createWebViewClient() = object : WebViewClient() {
    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
      super.onPageStarted(view, url, favicon)
      injectJavaScript(INSTALL_GLOBALS_SCRIPT.replace("\"%%WEBVIEW_ID%%\"", webViewId.toString()))
      this@DomWebView.injectedJSBeforeContentLoaded?.let {
        injectJavaScript(it)
      }
    }
  }

  private suspend fun nativeJsiEvalSync(deferredId: Int, source: String): String {
    return suspendCoroutine { continuation ->
      appContext.executeOnJavaScriptThread {
        val wrappedSource = NATIVE_EVAL_WRAPPER_SCRIPT
          .replace("\"%%DEFERRED_ID%%\"", deferredId.toString())
          .replace("\"%%WEBVIEW_ID%%\"", webViewId.toString())
          .replace("\"%%SOURCE%%\"", source)
        try {
          val result = appContext.hostingRuntimeContext.eval(wrappedSource)
          continuation.resume(result.getString())
        } catch (e: Exception) {
          continuation.resumeWithException(e)
        }
      }
    }
  }

  // endregion Internals
}
