package expo.modules.wikireader

import android.content.Context
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

private data class ComposeWebViewLoadingProgressChanged(
  @Field val progress: Int
) : Record

data class ComposeWebViewProps(
  val url: MutableState<String> = mutableStateOf(""),
  val modifiers: MutableState<ModifierList> = mutableStateOf(emptyList())
) : ComposeProps

class ComposeWebView(context: Context, appContext: AppContext) : ExpoComposeView<ComposeWebViewProps>(context, appContext) {
  override val props = ComposeWebViewProps()
  private var reloadDeferred: CompletableDeferred<Unit>? = null
  private val mutex = Mutex()
  private val onLoadingProgressChanged by EventDispatcher<ComposeWebViewLoadingProgressChanged>()

  private val webView by lazy {
    WebView(context).apply {
      settings.javaScriptEnabled = true
      settings.domStorageEnabled = true
      webViewClient = object : WebViewClient() {
        override fun onPageFinished(view: WebView?, url: String?) {
          super.onPageFinished(view, url)
          reloadDeferred?.complete(Unit)
          reloadDeferred = null
        }
      }

      webChromeClient = object : WebChromeClient() {
        override fun onProgressChanged(view: WebView?, newProgress: Int) {
          super.onProgressChanged(view, newProgress)
          onLoadingProgressChanged.invoke(ComposeWebViewLoadingProgressChanged(newProgress))
        }
      }
    }
  }

  @Composable
  override fun ComposableScope.Content() {
    val (url) = props.url
    val (modifiers) = props.modifiers

    AndroidView(
      modifier = Modifier
        .verticalScroll(rememberScrollState())
        .then(ModifierRegistry.applyModifiers(modifiers, appContext, this@Content, globalEventDispatcher)),
      factory = {
        webView.parent?.let { parentView ->
          (parentView as? ViewGroup)?.removeView(webView)
        }
        webView
      },
      update = { view ->
        if (url.isNotEmpty() && view.originalUrl != url) {
          view.loadUrl(url)
        }
      }
    )
  }

  suspend fun loadUrlAsync(url: String) {
    mutex.withLock {
      webView.loadUrl(url)
    }
  }

  suspend fun reloadAsync() {
    mutex.withLock {
      reloadDeferred = CompletableDeferred()
      webView.reload()
      reloadDeferred?.await()
    }
  }
}
